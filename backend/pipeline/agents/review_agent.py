"""
FlowForge AI — Code Review Agent

Stage 4: Takes all previous outputs and produces a comprehensive code
review checklist with quality, security, and performance analysis.
"""

from __future__ import annotations

from pipeline.agents.base import AgentContext, BaseAgent


class ReviewAgent(BaseAgent):
    """Adversarial review agent that finds gaps in the plan."""

    @property
    def stage_name(self) -> str:
        return "review"

    @property
    def display_name(self) -> str:
        return "Code Review"

    @property
    def order_index(self) -> float:
        return 4.0

    @property
    def dependencies(self) -> list[str]:
        return ["requirements", "design", "implementation"]

    @property
    def required_output_keys(self) -> list[str]:
        return [
            "summary",
            "code_quality_checklist",
            "potential_anti_patterns",
            "security_review",
            "performance_considerations",
            "suggested_review_workflow",
            "overall_assessment",
        ]

    def build_system_prompt(self) -> str:
        return """You are a Senior Code Review AI agent with an adversarial mindset. Your job is to critically review the entire workflow output and identify potential issues, anti-patterns, and improvement opportunities.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{
  "summary": "One-line review summary",
  "code_quality_checklist": [
    {"item": "Check item name", "status": "Pass|Review|Fail", "details": "Explanation"}
  ],
  "potential_anti_patterns": [
    {"pattern": "Anti-pattern name", "risk": "High|Medium|Low", "location": "Where it might occur", "recommendation": "How to fix"}
  ],
  "security_review": [
    {"concern": "Security concern", "severity": "High|Medium|Low", "recommendation": "Mitigation approach"}
  ],
  "performance_considerations": [
    {"area": "Performance area", "recommendation": "Optimization suggestion"}
  ],
  "suggested_review_workflow": ["Step 1", "Step 2", "Step 3"],
  "overall_assessment": "Final verdict with key strengths and areas for improvement"
}

Be thorough and critical. Identify at least 4 quality checks, 3 anti-patterns, 3 security concerns, and 3 performance items."""

    def build_user_prompt(self, context: AgentContext) -> str:
        req_output = context.previous_outputs.get("requirements", "{}")
        design_output = context.previous_outputs.get("design", "{}")
        impl_output = context.previous_outputs.get("implementation", "{}")
        return f"""Perform a comprehensive code review of the following workflow:

ORIGINAL FEATURE REQUEST:
{context.feature_request}

REQUIREMENTS ANALYSIS:
{req_output}

SOLUTION DESIGN:
{design_output}

IMPLEMENTATION PLAN:
{impl_output}

Respond with valid JSON only. Be critical and thorough."""
