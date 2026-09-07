"""
FlowForge AI — Base Agent

Abstract interface for all pipeline stage agents.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass
from typing import Any

from pipeline.json_utils import compact_json, extract_json_payload, require_keys


@dataclass
class AgentContext:
    """Immutable context passed between pipeline stages."""
    feature_request: str
    previous_outputs: dict[str, str]  # stage_name → JSON output string


@dataclass
class AgentResult:
    """Result of a single agent execution."""
    output: str          # JSON string of structured output
    success: bool = True
    error: str | None = None


class BaseAgent(abc.ABC):
    """
    Abstract pipeline stage agent.

    Each agent receives an AgentContext (feature request + all prior stage
    outputs) and produces an AgentResult with structured JSON output.
    """

    @property
    @abc.abstractmethod
    def stage_name(self) -> str:
        """Unique identifier for this pipeline stage."""
        ...

    @property
    @abc.abstractmethod
    def display_name(self) -> str:
        """Human-readable stage name for the UI."""
        ...

    @property
    def order_index(self) -> float:
        """Execution order (lower = earlier)."""
        return 0.0

    @property
    def dependencies(self) -> list[str]:
        """List of stage_names this agent depends on."""
        return []

    @property
    def required_output_keys(self) -> list[str]:
        """Top-level JSON keys expected from this agent."""
        return ["summary"]

    @property
    def max_attempts(self) -> int:
        """Number of attempts before the stage is marked failed."""
        return 2

    @abc.abstractmethod
    def build_system_prompt(self) -> str:
        """Build the system/instruction prompt for the AI provider."""
        ...

    @abc.abstractmethod
    def build_user_prompt(self, context: AgentContext) -> str:
        """Build the user prompt from the execution context."""
        ...

    async def execute(self, context: AgentContext, ai_provider: Any) -> AgentResult:
        """
        Execute this agent: build prompts, call AI, return structured result.

        Override this method for custom execution logic.
        """
        system_prompt = self.build_system_prompt()
        user_prompt = self.build_user_prompt(context)
        last_error: str | None = None

        for attempt in range(1, self.max_attempts + 1):
            try:
                output = await ai_provider.generate(system_prompt, user_prompt)
                payload = extract_json_payload(output)
                payload = require_keys(payload, self.required_output_keys, self.stage_name)
                return AgentResult(output=compact_json(payload), success=True)
            except Exception as e:
                last_error = str(e)
                user_prompt = self._build_retry_prompt(context, last_error)

        return AgentResult(output="{}", success=False, error=last_error or "Unknown agent error")

    def _build_retry_prompt(self, context: AgentContext, error: str) -> str:
        """Prompt used when the first model response cannot be parsed or validated."""
        return f"""{self.build_user_prompt(context)}

The previous response could not be accepted: {error}

Return only one valid JSON object. Do not include markdown fences, comments, or prose."""
