"""
FlowForge AI — Research Router

Provides endpoints for live web search and AI-driven technical synthesis.
Used by the frontend /research hub and external integrations.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.search_service import search_web, synthesize_research

router = APIRouter(prefix="/api/research", tags=["research"])


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Technical search query")
    max_results: int = Field(default=5, ge=1, le=10, description="Number of web sources to fetch")


class WebSourceItem(BaseModel):
    title: str
    url: str
    domain: str
    snippet: str


class RecommendedTool(BaseModel):
    name: str
    category: str
    why: str


class ResearchResponse(BaseModel):
    query: str
    summary: str
    key_findings: list[str] = Field(default_factory=list)
    recommended_stack: list[RecommendedTool] = Field(default_factory=list)
    architecture_insights: list[str] = Field(default_factory=list)
    suggested_workflow_prompt: str
    web_sources: list[WebSourceItem] = Field(default_factory=list)


@router.post("", response_model=ResearchResponse)
async def perform_research(payload: ResearchRequest):
    """
    Execute live web search and produce a technical synthesis with citations.
    """
    try:
        raw_sources = await search_web(payload.query, max_results=payload.max_results)
        synthesis = await synthesize_research(payload.query, raw_sources)
        synthesis["query"] = payload.query
        return synthesis
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Web research failed: {exc}")


@router.get("", response_model=ResearchResponse)
async def get_research(
    q: str = Query(..., min_length=2, max_length=500, description="Search query"),
    limit: int = Query(5, ge=1, le=10, description="Max web results"),
):
    """
    GET version for quick URL-based queries and search-bar auto-fetch.
    """
    payload = ResearchRequest(query=q, max_results=limit)
    return await perform_research(payload)
