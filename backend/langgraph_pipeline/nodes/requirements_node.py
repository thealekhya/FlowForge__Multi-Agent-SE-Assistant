"""
FlowForge AI — Requirements Analysis Node (LangGraph)

Stage 1: Decomposes a raw feature request into structured requirements,
user stories, acceptance criteria, and risk assessment.
"""

from __future__ import annotations

import json

from langchain_core.prompts import ChatPromptTemplate

from langgraph_pipeline.llm_provider import get_llm
from langgraph_pipeline.schemas import RequirementsOutput
from langgraph_pipeline.state import WorkflowState
from services.search_service import search_web

SYSTEM_PROMPT = """You are a Senior Requirements Analyst AI agent. Your task is to analyze a software feature request and produce a comprehensive requirements breakdown.
Use discovered real-world web sources to inform industry-standard requirements, security baselines, and risk mitigations.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{{
  "summary": "One-line summary of the feature",
  "functional_requirements": [
    {{
      "id": "FR-001",
      "title": "Requirement title",
      "description": "Detailed description",
      "priority": "High|Medium|Low",
      "acceptance_criteria": ["Criterion 1", "Criterion 2"]
    }}
  ],
  "non_functional_requirements": [
    {{"id": "NFR-001", "category": "Performance|Security|Scalability|Accessibility", "description": "...", "priority": "High|Medium|Low"}}
  ],
  "user_stories": ["As a <role>, I want <goal> so that <benefit>"],
  "risk_assessment": [
    {{"risk": "Risk description", "impact": "High|Medium|Low", "mitigation": "Mitigation strategy"}}
  ],
  "priority_classification": "High|Medium|Low — Justification",
  "web_sources": [
    {{"title": "Title", "url": "URL", "domain": "Domain", "snippet": "Context"}}
  ]
}}

Be thorough but concise. Generate at least 3 functional requirements, 3 non-functional requirements, 3 user stories, and 2 risks."""


async def requirements_node(state: WorkflowState) -> dict:
    """
    LangGraph node: Requirements Analysis Agent with Web Search.

    Reads:  state["feature_request"]
    Writes: state["requirements"] (with web citations)
    """
    llm = get_llm()

    # Autonomous Web Search
    try:
        discovered_sources = await search_web(
            f"{state['feature_request'][:100]} industry best practices github",
            max_results=3,
        )
    except Exception:
        discovered_sources = []

    web_context = "\n".join([
        f"- [{s.get('title')}]({s.get('url')}): {s.get('snippet')}"
        for s in discovered_sources
    ]) if discovered_sources else "No web results available."

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human",
         "Analyze the following software feature request and produce a structured requirements breakdown.\n\n"
         "FEATURE REQUEST:\n{feature_request}\n\n"
         "LIVE WEB RESEARCH & CITATIONS:\n{web_context}\n\n"
         "Respond with valid JSON only."),
    ])

    chain = prompt | llm

    try:
        # Try structured output first (works with Gemini/OpenAI)
        structured_chain = prompt | llm.with_structured_output(RequirementsOutput)
        result = await structured_chain.ainvoke({
            "feature_request": state["feature_request"],
            "web_context": web_context,
        })
        data = result.model_dump()
        if not data.get("web_sources") and discovered_sources:
            data["web_sources"] = discovered_sources
        return {"requirements": data}
    except Exception as exc:
        print(f"[requirements_node] Structured output error: {exc}, attempting raw text fallback...")

    # Fallback: raw text → JSON parse
    try:
        response = await chain.ainvoke({
            "feature_request": state["feature_request"],
            "web_context": web_context,
        })
        raw_content = response.content if hasattr(response, "content") else response
        if isinstance(raw_content, list):
            text = "".join(part.get("text", str(part)) if isinstance(part, dict) else str(part) for part in raw_content)
        else:
            text = str(raw_content)

        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].lstrip().startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        parsed = json.loads(cleaned)
    except Exception as exc:
        print(f"[requirements_node] Raw fallback error: {exc}, using template fallback...")
        from pipeline.agents.base import AgentContext
        from pipeline.agents.requirements_agent import RequirementsAgent
        from pipeline.ai_provider import SimulatedProvider

        sim_agent = RequirementsAgent()
        ctx = AgentContext(feature_request=state["feature_request"])
        res = await sim_agent.execute(ctx, SimulatedProvider())
        parsed = res.output_data if isinstance(res.output_data, dict) else {}

    if not parsed.get("web_sources") and discovered_sources:
        parsed["web_sources"] = discovered_sources

    return {"requirements": parsed}
