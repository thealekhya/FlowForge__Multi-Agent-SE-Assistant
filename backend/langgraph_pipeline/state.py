"""
FlowForge AI — LangGraph Workflow State

Defines the TypedDict that flows through every node in the
LangGraph StateGraph.  Each agent node reads its dependencies
from earlier keys and writes its own key.
"""

from __future__ import annotations

from typing import Optional, TypedDict


class WorkflowState(TypedDict, total=False):
    """
    Shared state that is passed through the LangGraph DAG.

    Keys:
        feature_request  – The original user prompt (set once at entry).
        requirements     – JSON dict produced by the Requirements Agent.
        design           – JSON dict produced by the Design Agent.
        implementation   – JSON dict produced by the Implementation Agent.
        review           – JSON dict produced by the Review Agent.
    """
    feature_request: str
    requirements: Optional[dict]
    design: Optional[dict]
    implementation: Optional[dict]
    review: Optional[dict]
