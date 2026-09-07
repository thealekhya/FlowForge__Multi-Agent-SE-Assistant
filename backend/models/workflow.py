"""
FlowForge AI — SQLAlchemy ORM Models

Defines the Workflow and StageResult tables.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _gen_id() -> str:
    return uuid.uuid4().hex[:12]


class Workflow(Base):
    """A single feature-request workflow run."""

    __tablename__ = "workflows"

    id = Column(String(12), primary_key=True, default=_gen_id)
    user_id = Column(String(64), nullable=True, index=True)
    feature_request = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending | running | completed | failed
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    stages = relationship(
        "StageResult",
        back_populates="workflow",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="StageResult.order_index",
    )


class StageResult(Base):
    """Output of a single pipeline stage within a workflow."""

    __tablename__ = "stage_results"

    id = Column(String(12), primary_key=True, default=_gen_id)
    workflow_id = Column(String(12), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(String(50), nullable=False)   # requirements | design | implementation | review
    order_index = Column(Float, default=0)
    status = Column(String(20), default="pending")     # pending | running | completed | failed
    input_context = Column(Text, default="{}")
    output = Column(Text, default="{}")
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    workflow = relationship("Workflow", back_populates="stages")
