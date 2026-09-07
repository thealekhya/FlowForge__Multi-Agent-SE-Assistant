"""
FlowForge AI — Solution Design Agent

Stage 2: Takes requirements analysis output and produces an architecture
design with component diagrams, tech stack, and API contracts.
"""

from __future__ import annotations

from pipeline.agents.base import AgentContext, BaseAgent


class DesignAgent(BaseAgent):
    """Generates a solution architecture based on requirements analysis."""

    @property
    def stage_name(self) -> str:
        return "design"

    @property
    def display_name(self) -> str:
        return "Solution Design"

    @property
    def order_index(self) -> float:
        return 2.0

    @property
    def dependencies(self) -> list[str]:
        return ["requirements"]

    @property
    def required_output_keys(self) -> list[str]:
        return [
            "summary",
            "architecture_pattern",
            "architecture_rationale",
            "component_diagram",
            "technology_stack",
            "api_contracts",
            "data_model",
            "design_decisions",
        ]

    def build_system_prompt(self) -> str:
        return """You are a Senior Solutions Architect AI agent. Based on a requirements analysis, design a comprehensive solution architecture.

You MUST respond with valid JSON only (no markdown fences, no extra text). Use this exact schema:

{
  "summary": "One-line architecture summary",
  "architecture_pattern": "Name of the architecture pattern (e.g., Layered, Microservices, Event-Driven)",
  "architecture_rationale": "Why this pattern was chosen",
  "component_diagram": "Mermaid graph TD diagram as a string",
  "technology_stack": {
    "frontend": {"framework": "...", "styling": "...", "state": "..."},
    "backend": {"framework": "...", "database": "...", "ai_integration": "..."},
    "communication": {"rest_api": "...", "real_time": "..."}
  },
  "api_contracts": [
    {"method": "GET|POST|PUT|DELETE", "endpoint": "/api/...", "description": "..."}
  ],
  "data_model": {
    "EntityName": {"fields": ["field1 (TYPE)", "field2 (TYPE)"]}
  },
  "design_decisions": ["Decision 1 with rationale", "Decision 2 with rationale"]
}

Generate a practical, production-ready architecture. Include a valid Mermaid diagram string."""

    def build_user_prompt(self, context: AgentContext) -> str:
        req_output = context.previous_outputs.get("requirements", "{}")
        return f"""Design a solution architecture based on the following:

ORIGINAL FEATURE REQUEST:
{context.feature_request}

REQUIREMENTS ANALYSIS:
{req_output}

Respond with valid JSON only."""
