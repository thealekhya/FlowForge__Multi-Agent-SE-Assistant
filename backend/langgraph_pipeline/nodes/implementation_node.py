"""
FlowForge AI — Implementation Planning Node (LangGraph)

Stage 3: Takes requirements + design outputs and produces a sprint-ready
task breakdown with effort estimates and dependency graphs.
"""

from __future__ import annotations

import json

from langchain_core.prompts import ChatPromptTemplate

from langgraph_pipeline.llm_provider import get_llm
from langgraph_pipeline.schemas import ImplementationOutput
from langgraph_pipeline.state import WorkflowState

SYSTEM_PROMPT = """You are a Senior Technical Project Manager AI agent. Based on requirements analysis and solution design, create a detailed implementation plan.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{{
  "summary": "One-line implementation plan summary",
  "milestones": [
    {{
      "id": "M1",
      "title": "Milestone title",
      "target": "Sprint/timeline target",
      "tasks": [
        {{
          "id": "T-101",
          "title": "Task title",
          "effort": "Estimated hours (e.g., 4h)",
          "priority": "Critical|High|Medium|Low",
          "dependencies": ["T-100"]
        }}
      ]
    }}
  ],
  "testing_strategy": {{
    "unit_tests": "Unit testing approach",
    "integration_tests": "Integration testing approach",
    "e2e_tests": "End-to-end testing approach",
    "coverage_target": "Target coverage percentage"
  }},
  "dependency_graph": "Mermaid graph LR diagram as a string showing task dependencies",
  "total_estimated_effort": "Total hours across all milestones"
}}

Create at least 3 milestones with 3-5 tasks each. Be realistic with effort estimates."""


async def implementation_node(state: WorkflowState) -> dict:
    """
    LangGraph node: Implementation Planning Agent.

    Reads:  state["feature_request"], state["requirements"], state["design"]
    Writes: state["implementation"]
    """
    llm = get_llm()
    requirements_json = json.dumps(state.get("requirements", {}), indent=2)
    design_json = json.dumps(state.get("design", {}), indent=2)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human",
         "Create an implementation plan based on the following:\n\n"
         "ORIGINAL FEATURE REQUEST:\n{feature_request}\n\n"
         "REQUIREMENTS ANALYSIS:\n{requirements}\n\n"
         "SOLUTION DESIGN:\n{design}\n\n"
         "Respond with valid JSON only."),
    ])

    chain = prompt | llm

    try:
        structured_chain = prompt | llm.with_structured_output(ImplementationOutput)
        result = await structured_chain.ainvoke({
            "feature_request": state["feature_request"],
            "requirements": requirements_json,
            "design": design_json,
        })
        return {"implementation": result.model_dump()}
    except Exception as exc:
        print(f"[implementation_node] Structured output error: {exc}, attempting raw text fallback...")

    try:
        response = await chain.ainvoke({
            "feature_request": state["feature_request"],
            "requirements": requirements_json,
            "design": design_json,
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
        print(f"[implementation_node] Raw fallback error: {exc}, using template fallback...")
        from pipeline.agents.base import AgentContext
        from pipeline.agents.implementation_agent import ImplementationAgent
        from pipeline.ai_provider import SimulatedProvider

        sim_agent = ImplementationAgent()
        ctx = AgentContext(
            feature_request=state["feature_request"],
            prior_outputs={
                "requirements": state.get("requirements", {}),
                "design": state.get("design", {}),
            },
        )
        res = await sim_agent.execute(ctx, SimulatedProvider())
        parsed = res.output_data if isinstance(res.output_data, dict) else {}

    return {"implementation": parsed}
