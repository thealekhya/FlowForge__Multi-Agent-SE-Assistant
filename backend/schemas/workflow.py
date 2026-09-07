"""
FlowForge AI — Pydantic Schemas

Request / response models for the REST API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Requests ────────────────────────────────────────────────

class WorkflowCreateRequest(BaseModel):
    feature_request: str = Field(..., min_length=10, max_length=5000, description="The software feature request to analyze")


# ── Stage Result ────────────────────────────────────────────

class StageResultResponse(BaseModel):
    id: str
    stage_name: str
    order_index: float
    status: str
    input_context: str
    output: str  # JSON string — parsed on the frontend
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Workflow ────────────────────────────────────────────────

class WorkflowResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    feature_request: str
    status: str
    created_at: datetime
    updated_at: datetime
    stages: list[StageResultResponse] = []

    model_config = {"from_attributes": True}


class WorkflowListItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    feature_request: str
    status: str
    created_at: datetime
    updated_at: datetime
    stage_count: int = 0

    model_config = {"from_attributes": True}


# ── SSE Event ───────────────────────────────────────────────

class SSEStageEvent(BaseModel):
    """Payload pushed over Server-Sent Events."""
    workflow_id: str
    stage_name: str
    status: str
    output: Optional[str] = None
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
