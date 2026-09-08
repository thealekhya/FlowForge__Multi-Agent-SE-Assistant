"""
FlowForge AI — Workflow Router

REST + SSE endpoints for workflow management.
"""

from __future__ import annotations

import asyncio
import base64
import json
from typing import AsyncGenerator

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sse_starlette.sse import EventSourceResponse

from core.database import get_session
from models.workflow import StageResult, Workflow
from pipeline.orchestrator import event_bus
from langgraph_pipeline.runner import run_langgraph_pipeline as run_pipeline
from schemas.workflow import (
    SSEStageEvent,
    WorkflowCreateRequest,
    WorkflowListItem,
    WorkflowResponse,
)
from services.export_service import (
    generate_docx_report,
    generate_markdown_report,
    generate_pdf_report,
)

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


async def get_current_user_id(
    x_user_id: str | None = Header(None, alias="x-user-id"),
    authorization: str | None = Header(None, alias="authorization"),
) -> str | None:
    """Extract authenticated Clerk user ID from X-User-Id header or Authorization Bearer JWT."""
    if x_user_id and x_user_id.strip():
        return x_user_id.strip()

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            parts = token.split(".")
            if len(parts) >= 2:
                payload_b64 = parts[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload_json = base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")
                payload_data = json.loads(payload_json)
                sub = payload_data.get("sub")
                if sub:
                    return str(sub)
        except Exception:
            pass

    return None


# ── CREATE ───────────────────────────────────────────────────

@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(
    body: WorkflowCreateRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    user_id: str | None = Depends(get_current_user_id),
):
    """Create a new workflow and trigger the AI pipeline."""
    workflow = Workflow(
        feature_request=body.feature_request,
        status="pending",
        user_id=user_id,
    )
    session.add(workflow)
    await session.commit()

    # Re-fetch with eager-loaded stages to avoid async lazy-load errors
    stmt = (
        select(Workflow)
        .where(Workflow.id == workflow.id)
        .options(selectinload(Workflow.stages))
    )
    result = await session.execute(stmt)
    workflow = result.scalar_one()

    # Launch the pipeline as a background task
    background_tasks.add_task(run_pipeline, workflow.id)

    return workflow


# ── LIST ─────────────────────────────────────────────────────

@router.get("", response_model=list[WorkflowListItem])
async def list_workflows(
    response: Response,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user_id: str | None = Depends(get_current_user_id),
):
    """List all workflows with pagination, newest first. Strictly isolated by user ID."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"

    stmt = (
        select(Workflow)
        .order_by(Workflow.created_at.desc())
    )
    if user_id:
        # Show workflows owned by this user AND unassigned/guest workflows so work is never lost across login boundaries
        stmt = stmt.where((Workflow.user_id == user_id) | (Workflow.user_id.is_(None)))
    else:
        # If no user ID provided, show unassigned/guest workflows
        stmt = stmt.where(Workflow.user_id.is_(None))

    stmt = stmt.offset(skip).limit(limit)
    result = await session.execute(stmt)
    workflows = result.scalars().all()

    items = []
    for w in workflows:
        # Count stages
        count_stmt = select(func.count()).where(StageResult.workflow_id == w.id)
        count_result = await session.execute(count_stmt)
        stage_count = count_result.scalar() or 0

        items.append(WorkflowListItem(
            id=w.id,
            user_id=w.user_id,
            feature_request=w.feature_request,
            status=w.status,
            created_at=w.created_at,
            updated_at=w.updated_at,
            stage_count=stage_count,
        ))

    return items


# ── GET BY ID ────────────────────────────────────────────────

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str | None = Depends(get_current_user_id),
):
    """Get a workflow with all stage results."""
    stmt = (
        select(Workflow)
        .where(Workflow.id == workflow_id)
        .options(selectinload(Workflow.stages))
    )
    result = await session.execute(stmt)
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # If this workflow is owned by a user, ensure other users cannot access it
    if workflow.user_id and user_id and workflow.user_id != user_id:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return workflow


# ── SSE STREAM ───────────────────────────────────────────────

@router.get("/{workflow_id}/stream")
async def stream_workflow(workflow_id: str):
    """Server-Sent Events stream for real-time pipeline updates."""

    async def event_generator() -> AsyncGenerator[dict, None]:
        queue = event_bus.subscribe(workflow_id)
        try:
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=300)
                if event is None or isinstance(event, dict):
                    # Pipeline complete — send final event and close
                    yield {
                        "event": "complete",
                        "data": json.dumps({
                            "workflow_id": workflow_id,
                            "status": event.get("status") if isinstance(event, dict) else None,
                        }),
                    }
                    break
                if isinstance(event, SSEStageEvent):
                    yield {
                        "event": "stage_update",
                        "data": event.model_dump_json(),
                    }
        except asyncio.TimeoutError:
            yield {"event": "timeout", "data": json.dumps({"message": "Stream timed out"})}
        finally:
            event_bus.unsubscribe(workflow_id, queue)

    return EventSourceResponse(event_generator())


# ── EXPORT ───────────────────────────────────────────────────

@router.get("/{workflow_id}/export.{fmt}")
@router.get("/{workflow_id}/export")
async def export_workflow(
    workflow_id: str,
    fmt: str | None = None,
    format: str | None = Query(None, description="Export format: md, pdf, or docx"),
    session: AsyncSession = Depends(get_session),
    user_id: str | None = Depends(get_current_user_id),
):
    """Export workflow as a Markdown, PDF, or Word (.docx) report."""
    stmt = (
        select(Workflow)
        .where(Workflow.id == workflow_id)
        .options(selectinload(Workflow.stages))
    )
    result = await session.execute(stmt)
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow.user_id and user_id and workflow.user_id != user_id:
        raise HTTPException(status_code=404, detail="Workflow not found")

    format_choice = (fmt or format or "md").lower().strip()
    short_id = workflow_id[:8]

    if format_choice == "pdf":
        try:
            pdf_bytes = generate_pdf_report(workflow)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="flowforge_report_{short_id}.pdf"',
                    "Content-Length": str(len(pdf_bytes)),
                    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
                },
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {exc}")

    elif format_choice == "docx":
        try:
            docx_bytes = generate_docx_report(workflow)
            return Response(
                content=docx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={
                    "Content-Disposition": f'attachment; filename="flowforge_report_{short_id}.docx"',
                    "Content-Length": str(len(docx_bytes)),
                    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
                },
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to generate DOCX: {exc}")

    else:
        # Default: Markdown
        md = generate_markdown_report(workflow)
        md_bytes = md.encode("utf-8")
        return Response(
            content=md_bytes,
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="flowforge_report_{short_id}.md"',
                "Content-Length": str(len(md_bytes)),
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
            },
        )


# ── DELETE ───────────────────────────────────────────────────

@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str | None = Depends(get_current_user_id),
):
    """Delete a workflow and all its stage results."""
    workflow = await session.get(Workflow, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow.user_id and user_id and workflow.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot delete another user's workflow")

    await session.delete(workflow)
    await session.commit()
