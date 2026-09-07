"""
FlowForge AI — Implementation Planning Agent

Stage 3: Takes requirements + design outputs and produces a sprint-ready
task breakdown with effort estimates and dependency graphs.
"""

from __future__ import annotations

from pipeline.agents.base import AgentContext, BaseAgent


class ImplementationAgent(BaseAgent):
    """Creates implementation plan with tasks, milestones, and estimates."""

    @property
    def stage_name(self) -> str:
        return "implementation"

    @property
    def display_name(self) -> str:
        return "Implementation Planning"

    @property
    def order_index(self) -> float:
        return 3.0

    @property
    def dependencies(self) -> list[str]:
        return ["requirements", "design"]

    @property
    def required_output_keys(self) -> list[str]:
        return [
            "summary",
            "milestones",
            "testing_strategy",
            "dependency_graph",
            "total_estimated_effort",
        ]

    def build_system_prompt(self) -> str:
        return """You are a Senior Technical Project Manager AI agent. Based on requirements analysis and solution design, create a detailed implementation plan.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{
  "summary": "One-line implementation plan summary",
  "milestones": [
    {
      "id": "M1",
      "title": "Milestone title",
      "target": "Sprint/timeline target",
      "tasks": [
        {
          "id": "T-101",
          "title": "Task title",
          "effort": "Estimated hours (e.g., 4h)",
          "priority": "Critical|High|Medium|Low",
          "dependencies": ["T-100"]
        }
      ]
    }
  ],
  "testing_strategy": {
    "unit_tests": "Unit testing approach",
    "integration_tests": "Integration testing approach",
    "e2e_tests": "End-to-end testing approach",
    "coverage_target": "Target coverage percentage"
  },
  "dependency_graph": "Mermaid graph LR diagram as a string showing task dependencies",
  "total_estimated_effort": "Total hours across all milestones"
}

Create at least 3 milestones with 3-5 tasks each. Be realistic with effort estimates."""

    def build_user_prompt(self, context: AgentContext) -> str:
        req_output = context.previous_outputs.get("requirements", "{}")
        design_output = context.previous_outputs.get("design", "{}")
        return f"""Create an implementation plan based on the following:

ORIGINAL FEATURE REQUEST:
{context.feature_request}

REQUIREMENTS ANALYSIS:
{req_output}

SOLUTION DESIGN:
{design_output}

Respond with valid JSON only."""
