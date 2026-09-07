"""
FlowForge AI — Requirements Analysis Agent

Stage 1: Decomposes a raw feature request into structured requirements,
user stories, acceptance criteria, and risk assessment.
"""

from __future__ import annotations

from pipeline.agents.base import AgentContext, BaseAgent


class RequirementsAgent(BaseAgent):
    """Analyzes a feature request and produces structured requirements."""

    @property
    def stage_name(self) -> str:
        return "requirements"

    @property
    def display_name(self) -> str:
        return "Requirements Analysis"

    @property
    def order_index(self) -> float:
        return 1.0

    @property
    def dependencies(self) -> list[str]:
        return []  # First stage — no dependencies

    @property
    def required_output_keys(self) -> list[str]:
        return [
            "summary",
            "functional_requirements",
            "non_functional_requirements",
            "user_stories",
            "risk_assessment",
            "priority_classification",
        ]

    def build_system_prompt(self) -> str:
        return """You are a Senior Requirements Analyst AI agent. Your task is to analyze a software feature request and produce a comprehensive requirements breakdown.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{
  "summary": "One-line summary of the feature",
  "functional_requirements": [
    {
      "id": "FR-001",
      "title": "Requirement title",
      "description": "Detailed description",
      "priority": "High|Medium|Low",
      "acceptance_criteria": ["Criterion 1", "Criterion 2"]
    }
  ],
  "non_functional_requirements": [
    {"id": "NFR-001", "category": "Performance|Security|Scalability|Accessibility", "description": "...", "priority": "High|Medium|Low"}
  ],
  "user_stories": ["As a <role>, I want <goal> so that <benefit>"],
  "risk_assessment": [
    {"risk": "Risk description", "impact": "High|Medium|Low", "mitigation": "Mitigation strategy"}
  ],
  "priority_classification": "High|Medium|Low — Justification"
}

Be thorough but concise. Generate at least 3 functional requirements, 3 non-functional requirements, 3 user stories, and 2 risks."""

    def build_user_prompt(self, context: AgentContext) -> str:
        return f"""Analyze the following software feature request and produce a structured requirements breakdown:

FEATURE REQUEST:
{context.feature_request}

Respond with valid JSON only."""
