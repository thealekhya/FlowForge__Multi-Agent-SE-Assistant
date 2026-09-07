"""
FlowForge AI — Solution Design Node (LangGraph)

Stage 2: Takes requirements analysis output and produces an architecture
design with component diagrams, tech stack, and API contracts.
"""

from __future__ import annotations

import json

from langchain_core.prompts import ChatPromptTemplate

from langgraph_pipeline.llm_provider import get_llm
from langgraph_pipeline.schemas import DesignOutput
from langgraph_pipeline.state import WorkflowState
from services.search_service import search_web

SYSTEM_PROMPT = """You are a Senior Solutions Architect AI agent. Based on a requirements analysis and real-world web research, design a comprehensive solution architecture.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{{
  "summary": "One-line architecture summary",
  "architecture_pattern": "Name of the architecture pattern (e.g., Layered, Microservices, Event-Driven)",
  "architecture_rationale": "Why this pattern was chosen",
  "component_diagram": "Mermaid graph TD diagram as a string",
  "technology_stack": {{
    "frontend": {{"framework": "...", "styling": "...", "state": "..."}},
    "backend": {{"framework": "...", "database": "...", "ai_integration": "..."}},
    "communication": {{"rest_api": "...", "real_time": "..."}}
  }},
  "api_contracts": [
    {{"method": "GET|POST|PUT|DELETE", "endpoint": "/api/...", "description": "..."}}
  ],
  "data_model": {{
    "EntityName": {{"fields": ["field1 (TYPE)", "field2 (TYPE)"]}}
  }},
  "design_decisions": ["Decision 1 with rationale", "Decision 2 with rationale"],
  "web_sources": [
    {{"title": "Title", "url": "URL", "domain": "Domain", "snippet": "Context"}}
  ]
}}

Generate a practical, production-ready architecture. Include a valid Mermaid diagram string."""


async def design_node(state: WorkflowState) -> dict:
    """
    LangGraph node: Solution Design Agent with Web Research.

    Reads:  state["feature_request"], state["requirements"]
    Writes: state["design"] (with web citations)
    """
    llm = get_llm()
    requirements_json = json.dumps(state.get("requirements", {}), indent=2)

    # Autonomous Web Search for Tech Stack & Libraries
    try:
        discovered_sources = await search_web(
            f"{state['feature_request'][:100]} github open-source library architecture",
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
         "Design a solution architecture based on the following:\n\n"
         "ORIGINAL FEATURE REQUEST:\n{feature_request}\n\n"
         "REQUIREMENTS ANALYSIS:\n{requirements}\n\n"
         "LIVE WEB RESEARCH & DISCOVERED LIBRARIES:\n{web_context}\n\n"
         "Respond with valid JSON only."),
    ])

    chain = prompt | llm

    try:
        structured_chain = prompt | llm.with_structured_output(DesignOutput)
        result = await structured_chain.ainvoke({
            "feature_request": state["feature_request"],
            "requirements": requirements_json,
            "web_context": web_context,
        })
        data = result.model_dump()
        if not data.get("web_sources") and discovered_sources:
            data["web_sources"] = discovered_sources
        return {"design": data}
    except Exception as exc:
        print(f"[design_node] Structured output error: {exc}, attempting raw text fallback...")

    try:
        response = await chain.ainvoke({
            "feature_request": state["feature_request"],
            "requirements": requirements_json,
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
        print(f"[design_node] Raw fallback error: {exc}, using template fallback...")
        from pipeline.agents.base import AgentContext
        from pipeline.agents.design_agent import DesignAgent
        from pipeline.ai_provider import SimulatedProvider

        sim_agent = DesignAgent()
        ctx = AgentContext(
            feature_request=state["feature_request"],
            prior_outputs={"requirements": state.get("requirements", {})},
        )
        res = await sim_agent.execute(ctx, SimulatedProvider())
        parsed = res.output_data if isinstance(res.output_data, dict) else {}

    if not parsed.get("web_sources") and discovered_sources:
        parsed["web_sources"] = discovered_sources

    return {"design": parsed}
