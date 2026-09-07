"""
FlowForge AI — LangGraph Pipeline Runner

Drop-in replacement for pipeline.orchestrator.run_pipeline().

Streams the LangGraph DAG execution, updating the database and
emitting SSE events at each node transition — exactly matching the
event contract the frontend expects.
"""

from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import async_session
from models.workflow import StageResult, Workflow
from pipeline.json_utils import compact_json, error_payload
from pipeline.orchestrator import event_bus
from schemas.workflow import SSEStageEvent


# Mapping from LangGraph node names to stage metadata
STAGE_CONFIG = {
    "requirements": {"order_index": 1.0, "display": "Requirements Analysis"},
    "design":       {"order_index": 2.0, "display": "Solution Design"},
    "implementation": {"order_index": 3.0, "display": "Implementation Planning"},
    "review":       {"order_index": 4.0, "display": "Code Review"},
}


async def run_langgraph_pipeline(workflow_id: str) -> None:
    """
    Execute the LangGraph 4-stage pipeline for a workflow.

    This is a drop-in replacement for the old run_pipeline():
      • Creates / resets stage rows in the database
      • Streams the graph with astream() to get per-node events
      • Publishes SSE events matching the frontend's expected format
      • Falls back to simulated provider on LLM errors
    """
    # Import here to avoid circular imports at module level
    from langgraph_pipeline.graph import pipeline

    final_status: str | None = None

    try:
        async with async_session() as session:
            # ── Load Workflow ───────────────────────────────
            workflow = await session.get(Workflow, workflow_id)
            if not workflow:
                final_status = "not_found"
                return

            workflow.status = "running"
            await session.commit()

            # ── Create / Reset Stage Rows ───────────────────
            for stage_name, config in STAGE_CONFIG.items():
                stage = await _get_or_create_stage(
                    session, workflow_id, stage_name, config["order_index"]
                )
                stage.status = "pending"
                stage.output = "{}"
                stage.error_message = None
                stage.duration_seconds = None
                stage.completed_at = None
            await session.commit()

            # ── Execute LangGraph DAG ───────────────────────
            all_succeeded = True
            node_start_times: dict[str, float] = {}

            # Set start time and mark first stage running
            stage_keys = list(STAGE_CONFIG.keys())
            first_stage = stage_keys[0]
            node_start_times[first_stage] = time.monotonic()
            first_db_stage = await _get_or_create_stage(
                session, workflow_id, first_stage, STAGE_CONFIG[first_stage]["order_index"]
            )
            first_db_stage.status = "running"
            await session.commit()
            await event_bus.publish(
                workflow_id,
                SSEStageEvent(
                    workflow_id=workflow_id,
                    stage_name=first_stage,
                    status="running",
                ),
            )

            initial_state = {"feature_request": workflow.feature_request}

            async for event in pipeline.astream(
                initial_state,
                stream_mode="updates",
            ):
                # event is a dict like {"requirements": {"summary": ...}}
                # Each key is the node name that just completed
                for node_name, node_output in event.items():
                    if node_name not in STAGE_CONFIG:
                        continue

                    elapsed = round(
                        time.monotonic() - node_start_times.get(node_name, time.monotonic()),
                        2,
                    )

                    stage = await _get_or_create_stage(
                        session,
                        workflow_id,
                        node_name,
                        STAGE_CONFIG[node_name]["order_index"],
                    )

                    # Unpack if nested: e.g. {"requirements": {...}} -> {...}
                    clean_output = node_output
                    if isinstance(node_output, dict) and node_name in node_output:
                        clean_output = node_output[node_name]

                    # Mark completed
                    stage.status = "completed"
                    stage.output = compact_json(clean_output)
                    stage.duration_seconds = elapsed
                    stage.completed_at = datetime.now(timezone.utc)
                    await session.commit()

                    # Emit SSE
                    await event_bus.publish(
                        workflow_id,
                        SSEStageEvent(
                            workflow_id=workflow_id,
                            stage_name=node_name,
                            status="completed",
                            output=stage.output,
                            duration_seconds=elapsed,
                        ),
                    )

                    # Publish "running" for the NEXT stage
                    stage_names = list(STAGE_CONFIG.keys())
                    current_idx = stage_names.index(node_name)
                    if current_idx + 1 < len(stage_names):
                        next_name = stage_names[current_idx + 1]
                        next_stage = await _get_or_create_stage(
                            session,
                            workflow_id,
                            next_name,
                            STAGE_CONFIG[next_name]["order_index"],
                        )
                        next_stage.status = "running"
                        await session.commit()
                        node_start_times[next_name] = time.monotonic()

                        await event_bus.publish(
                            workflow_id,
                            SSEStageEvent(
                                workflow_id=workflow_id,
                                stage_name=next_name,
                                status="running",
                            ),
                        )

                    await asyncio.sleep(0.15)  # Small delay for UI visual effect

            # ── Finalize ────────────────────────────────────
            # Check if any stage ended as failed
            for stage_name in STAGE_CONFIG:
                stage = await _get_or_create_stage(
                    session,
                    workflow_id,
                    stage_name,
                    STAGE_CONFIG[stage_name]["order_index"],
                )
                if stage.status != "completed":
                    all_succeeded = False

            workflow.status = "completed" if all_succeeded else "failed"
            final_status = workflow.status
            workflow.updated_at = datetime.now(timezone.utc)
            await session.commit()

    except Exception as exc:
        # If the entire graph fails, mark remaining stages as failed
        final_status = "failed"
        try:
            async with async_session() as session:
                workflow = await session.get(Workflow, workflow_id)
                if workflow:
                    workflow.status = "failed"
                    workflow.updated_at = datetime.now(timezone.utc)

                    for stage_name, config in STAGE_CONFIG.items():
                        stage = await _get_or_create_stage(
                            session, workflow_id, stage_name, config["order_index"]
                        )
                        if stage.status not in ("completed", "failed"):
                            stage.status = "failed"
                            stage.error_message = str(exc)
                            stage.output = error_payload(stage_name, str(exc))

                    await session.commit()
        except Exception:
            pass  # Best effort cleanup

    finally:
        await event_bus.close(workflow_id, final_status)


async def _get_or_create_stage(
    session: AsyncSession,
    workflow_id: str,
    stage_name: str,
    order_index: float,
) -> StageResult:
    """Return the stage row, creating it when needed."""
    stmt = select(StageResult).where(
        StageResult.workflow_id == workflow_id,
        StageResult.stage_name == stage_name,
    )
    result = await session.execute(stmt)
    stage = result.scalar_one_or_none()

    if stage is not None:
        return stage

    stage = StageResult(
        workflow_id=workflow_id,
        stage_name=stage_name,
        order_index=order_index,
        status="pending",
    )
    session.add(stage)
    await session.flush()
    return stage
