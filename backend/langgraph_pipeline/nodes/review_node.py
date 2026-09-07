"""
FlowForge AI — Code Review Node (LangGraph)

Stage 4: Takes all previous outputs and produces a comprehensive code
review checklist with quality, security, and performance analysis.
"""

from __future__ import annotations

import json

from langchain_core.prompts import ChatPromptTemplate

from langgraph_pipeline.llm_provider import get_llm
from langgraph_pipeline.schemas import ReviewOutput
from langgraph_pipeline.state import WorkflowState

SYSTEM_PROMPT = """You are a Senior Code Review AI agent with an adversarial mindset. Your job is to critically review the entire workflow output and identify potential issues, anti-patterns, and improvement opportunities.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{{
  "summary": "One-line review summary",
  "code_quality_checklist": [
    {{"item": "Check item name", "status": "Pass|Review|Fail", "details": "Explanation"}}
  ],
  "potential_anti_patterns": [
    {{"pattern": "Anti-pattern name", "risk": "High|Medium|Low", "location": "Where it might occur", "recommendation": "How to fix"}}
  ],
  "security_review": [
    {{"concern": "Security concern", "severity": "High|Medium|Low", "recommendation": "Mitigation approach"}}
  ],
  "performance_considerations": [
    {{"area": "Performance area", "recommendation": "Optimization suggestion"}}
  ],
  "suggested_review_workflow": ["Step 1", "Step 2", "Step 3"],
  "overall_assessment": "Final verdict with key strengths and areas for improvement"
}}

Be thorough and critical. Identify at least 4 quality checks, 3 anti-patterns, 3 security concerns, and 3 performance items."""


async def review_node(state: WorkflowState) -> dict:
    """
    LangGraph node: Code Review & Quality Audit Agent.

    Reads:  state["feature_request"], state["requirements"], state["design"], state["implementation"]
    Writes: state["review"]
    """
    llm = get_llm()
    requirements_json = json.dumps(state.get("requirements", {}), indent=2)
    design_json = json.dumps(state.get("design", {}), indent=2)
    implementation_json = json.dumps(state.get("implementation", {}), indent=2)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human",
         "Perform a comprehensive code review of the following workflow:\n\n"
         "ORIGINAL FEATURE REQUEST:\n{feature_request}\n\n"
         "REQUIREMENTS ANALYSIS:\n{requirements}\n\n"
         "SOLUTION DESIGN:\n{design}\n\n"
         "IMPLEMENTATION PLAN:\n{implementation}\n\n"
         "Respond with valid JSON only. Be critical and thorough."),
    ])

    chain = prompt | llm

    try:
        structured_chain = prompt | llm.with_structured_output(ReviewOutput)
        result = await structured_chain.ainvoke({
            "feature_request": state["feature_request"],
            "requirements": requirements_json,
            "design": design_json,
            "implementation": implementation_json,
        })
        return {"review": result.model_dump()}
    except Exception as exc:
        print(f"[review_node] Structured output error: {exc}, attempting raw text fallback...")

    try:
        response = await chain.ainvoke({
            "feature_request": state["feature_request"],
            "requirements": requirements_json,
            "design": design_json,
            "implementation": implementation_json,
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
        print(f"[review_node] Raw fallback error: {exc}, using template fallback...")
        from pipeline.agents.base import AgentContext
        from pipeline.agents.review_agent import ReviewAgent
        from pipeline.ai_provider import SimulatedProvider

        sim_agent = ReviewAgent()
        ctx = AgentContext(
            feature_request=state["feature_request"],
            prior_outputs={
                "requirements": state.get("requirements", {}),
                "design": state.get("design", {}),
                "implementation": state.get("implementation", {}),
            },
        )
        res = await sim_agent.execute(ctx, SimulatedProvider())
        parsed = res.output_data if isinstance(res.output_data, dict) else {}

    return {"review": parsed}
