"""
FlowForge AI — Pipeline Orchestrator

DAG-based pipeline engine that:
  • Resolves stage dependencies
  • Executes agents sequentially with context passing
  • Emits SSE events at each stage transition
  • Handles errors gracefully with per-stage isolation
"""

from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone

from sqlalchemy import select

from core.database import async_session
from models.workflow import StageResult, Workflow
from pipeline.agents.base import AgentContext, BaseAgent
from pipeline.agents.requirements_agent import RequirementsAgent
from pipeline.agents.design_agent import DesignAgent
from pipeline.agents.implementation_agent import ImplementationAgent
from pipeline.agents.review_agent import ReviewAgent
from pipeline.ai_provider import SimulatedProvider, get_ai_provider
from pipeline.json_utils import compact_json, error_payload
from schemas.workflow import SSEStageEvent


# ── Pipeline DAG Definition ─────────────────────────────────

def _build_pipeline() -> list[BaseAgent]:
    """Construct the ordered list of pipeline agents."""
    agents: list[BaseAgent] = [
        RequirementsAgent(),
        DesignAgent(),
        ImplementationAgent(),
        ReviewAgent(),
    ]
    # Sort by order_index to enforce DAG execution order
    agents.sort(key=lambda a: a.order_index)
    return agents


# ── SSE Event Bus ────────────────────────────────────────────

class EventBus:
    """Simple in-memory pub/sub for SSE events per workflow."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, workflow_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.setdefault(workflow_id, []).append(queue)
        return queue

    def unsubscribe(self, workflow_id: str, queue: asyncio.Queue) -> None:
        if workflow_id in self._subscribers:
            self._subscribers[workflow_id] = [
                q for q in self._subscribers[workflow_id] if q is not queue
            ]

    async def publish(self, workflow_id: str, event: SSEStageEvent) -> None:
        for queue in self._subscribers.get(workflow_id, []):
            await queue.put(event)

    async def close(self, workflow_id: str, final_status: str | None = None) -> None:
        """Send sentinel None to signal stream end."""
        sentinel = {"status": final_status} if final_status else None
        for queue in self._subscribers.get(workflow_id, []):
            await queue.put(sentinel)
        self._subscribers.pop(workflow_id, None)


# Global event bus singleton
event_bus = EventBus()


# ── Orchestrator ─────────────────────────────────────────────

async def run_pipeline(workflow_id: str) -> None:
    """
    Execute the full pipeline for a workflow.

    This runs as a background task, updating the database and emitting
    SSE events as each stage progresses.
    """
    final_status: str | None = None
    try:
        ai_provider = get_ai_provider()
        agents = _build_pipeline()

        async with async_session() as session:
            workflow = await session.get(Workflow, workflow_id)
            if not workflow:
                final_status = "not_found"
                return

            workflow.status = "running"
            await session.commit()

            for agent in agents:
                stage = await _get_or_create_stage(session, workflow_id, agent)
                stage.status = "pending"
                stage.output = "{}"
                stage.error_message = None
                stage.duration_seconds = None
                stage.completed_at = None
            await session.commit()

            context = AgentContext(
                feature_request=workflow.feature_request,
                previous_outputs={},
            )
            all_succeeded = True

            for agent in agents:
                stage = await _get_or_create_stage(session, workflow_id, agent)
                missing_dependencies = [
                    dep for dep in agent.dependencies
                    if dep not in context.previous_outputs
                ]

                if missing_dependencies:
                    message = f"Missing dependency output: {', '.join(missing_dependencies)}"
                    await _mark_stage_failed(session, workflow_id, stage, message, 0)
                    all_succeeded = False
                    continue

                active_provider = ai_provider
                stage_context = {
                    "feature_request": context.feature_request,
                    "available_stage_outputs": sorted(context.previous_outputs.keys()),
                    "provider": getattr(active_provider, "provider_name", "unknown"),
                    "fallback_reason": getattr(active_provider, "fallback_reason", None),
                }
                stage.input_context = compact_json(stage_context)
                stage.status = "running"
                await session.commit()
                await _publish_stage(workflow_id, stage)

                start_time = time.monotonic()
                try:
                    agent_result = await agent.execute(context, active_provider)
                    elapsed = round(time.monotonic() - start_time, 2)

                    if (
                        not agent_result.success
                        and _can_retry_with_simulated(agent_result.error)
                    ):
                        active_provider = SimulatedProvider(
                            fallback_reason=_provider_error_summary(agent_result.error)
                        )
                        stage_context["provider"] = active_provider.provider_name
                        stage_context["fallback_reason"] = active_provider.fallback_reason
                        stage.input_context = compact_json(stage_context)
                        retry_start = time.monotonic()
                        agent_result = await agent.execute(context, active_provider)
                        elapsed = round(elapsed + time.monotonic() - retry_start, 2)

                    if agent_result.success:
                        stage.status = "completed"
                        stage.output = agent_result.output
                        stage.duration_seconds = elapsed
                        stage.completed_at = datetime.now(timezone.utc)
                        context.previous_outputs[agent.stage_name] = agent_result.output
                    else:
                        await _mark_stage_failed(
                            session,
                            workflow_id,
                            stage,
                            agent_result.error or "Unknown agent error",
                            elapsed,
                            publish=False,
                        )
                        all_succeeded = False

                except Exception as e:
                    elapsed = round(time.monotonic() - start_time, 2)
                    await _mark_stage_failed(
                        session,
                        workflow_id,
                        stage,
                        str(e),
                        elapsed,
                        publish=False,
                    )
                    all_succeeded = False

                await session.commit()
                await _publish_stage(workflow_id, stage)
                await asyncio.sleep(0.2)

            workflow.status = "completed" if all_succeeded else "failed"
            final_status = workflow.status
            workflow.updated_at = datetime.now(timezone.utc)
            await session.commit()
    finally:
        await event_bus.close(workflow_id, final_status)


async def _get_or_create_stage(
    session,
    workflow_id: str,
    agent: BaseAgent,
) -> StageResult:
    """Return the stage row for an agent, creating it when needed."""
    stmt = select(StageResult).where(
        StageResult.workflow_id == workflow_id,
        StageResult.stage_name == agent.stage_name,
    )
    result = await session.execute(stmt)
    stage = result.scalar_one_or_none()
    if stage is not None:
        return stage

    stage = StageResult(
        workflow_id=workflow_id,
        stage_name=agent.stage_name,
        order_index=agent.order_index,
        status="pending",
    )
    session.add(stage)
    await session.flush()
    return stage


async def _mark_stage_failed(
    session,
    workflow_id: str,
    stage: StageResult,
    message: str,
    duration_seconds: float,
    publish: bool = True,
) -> None:
    """Persist a failed stage and optionally notify subscribers."""
    stage.status = "failed"
    stage.error_message = message
    stage.output = error_payload(stage.stage_name, message)
    stage.duration_seconds = duration_seconds
    stage.completed_at = datetime.now(timezone.utc)
    await session.commit()

    if publish:
        await _publish_stage(workflow_id, stage)


async def _publish_stage(workflow_id: str, stage: StageResult) -> None:
    """Publish a database stage as an SSE event."""
    await event_bus.publish(workflow_id, SSEStageEvent(
        workflow_id=workflow_id,
        stage_name=stage.stage_name,
        status=stage.status,
        output=stage.output if stage.status in {"completed", "failed"} else None,
        error_message=stage.error_message,
        duration_seconds=stage.duration_seconds,
    ))


def _can_retry_with_simulated(error: str | None) -> bool:
    """Return True for external-provider failures where demo fallback is useful."""
    if not error:
        return False

    lowered = error.lower()
    retryable_markers = [
        "429",
        "insufficient_quota",
        "credit_balance_exhausted",
        "rate_limit",
        "quota",
        "billing",
    ]
    return any(marker in lowered for marker in retryable_markers)


def _provider_error_summary(error: str | None) -> str:
    """Keep provider failure details readable in the UI."""
    if not error:
        return "External provider failed; used simulated provider."
    if "credit_balance_exhausted" in error or "insufficient_quota" in error:
        return "OpenAI quota/credits exhausted; used simulated provider."
    if "429" in error:
        return "OpenAI rate limit or quota error; used simulated provider."
    return "External provider unavailable; used simulated provider."
