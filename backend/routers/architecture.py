"""
FlowForge AI — Architecture & DAG Router

Exposes endpoints to inspect the compiled multi-agent LangGraph pipeline topology,
node definitions, and Mermaid visual code.
"""

from __future__ import annotations

from fastapi import APIRouter
from langgraph_pipeline.graph import pipeline

router = APIRouter(prefix="/api/architecture", tags=["Architecture"])


@router.get("/dag")
async def get_pipeline_dag():
    """
    Returns the multi-agent LangGraph topology in Mermaid diagram format
    and metadata for visual rendering and download.
    """
    try:
        mermaid_code = pipeline.get_graph().draw_mermaid()
    except Exception as e:
        mermaid_code = """graph TD
    __start__([__start__]) --> requirements
    requirements[Stage 1: Requirements Decomposition] --> design
    design[Stage 2: Solution Architecture] --> implementation
    implementation[Stage 3: Sprint DAG Planning] --> review
    review[Stage 4: Adversarial Security Gate] --> __end__([__end__])"""

    return {
        "status": "success",
        "pipeline_name": "FlowForge AI Autonomous Pipeline",
        "stages": [
            {
                "id": "requirements",
                "name": "Autonomous Requirements Decomposition",
                "agent": "Requirements Agent",
                "role": "AST analysis, functional/non-functional specs & live web crawling"
            },
            {
                "id": "design",
                "name": "Relational Schema & System Design",
                "agent": "Solutions Architect Agent",
                "role": "Architecture synthesis, tech stack matrix, API contracts & component diagrams"
            },
            {
                "id": "implementation",
                "name": "Sprint DAG & Task Breakdown",
                "agent": "Lead Engineer Agent",
                "role": "Milestone planning, atomic tasks (<250 LOC) & testing matrix"
            },
            {
                "id": "review",
                "name": "Adversarial Code Review & Security Gate",
                "agent": "Staff Security Engineer Agent",
                "role": "OWASP audit, race condition probes, N+1 query checks & quality score"
            }
        ],
        "mermaid": mermaid_code,
    }
