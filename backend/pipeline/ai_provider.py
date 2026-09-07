"""
FlowForge AI — AI Provider Abstraction

Unified interface for AI completion with three backends:
  • OpenAIProvider  — OpenAI Chat Completions API
  • GeminiProvider  — Google Generative AI
  • SimulatedProvider — Intelligent template-based responses (no API key)
"""

from __future__ import annotations

import abc
import asyncio
import json
import re

from core.config import settings


class BaseAIProvider(abc.ABC):
    """Abstract AI provider interface."""

    provider_name = "base"

    @abc.abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Send a prompt to the AI model and return the raw text response."""
        ...


# ── OpenAI Provider ─────────────────────────────────────────

class OpenAIProvider(BaseAIProvider):
    """OpenAI Chat Completions API provider."""

    provider_name = "openai"

    def __init__(self) -> None:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = await asyncio.wait_for(
            self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=4096,
                response_format={"type": "json_object"},
            ),
            timeout=60,
        )
        return response.choices[0].message.content or ""


# ── Gemini Provider ─────────────────────────────────────────

class GeminiProvider(BaseAIProvider):
    """Google Generative AI (Gemini) provider."""

    provider_name = "gemini"

    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required when AI_PROVIDER=gemini")
        self.model_name = settings.GEMINI_MODEL
        self._modern_client = None
        self._legacy_model = None

        try:
            from google import genai
            self._modern_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._legacy_model = genai.GenerativeModel(self.model_name)

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        combined = f"{system_prompt}\n\n---\n\n{user_prompt}"
        if self._modern_client is not None:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self._modern_client.models.generate_content,
                    model=self.model_name,
                    contents=combined,
                    config={"response_mime_type": "application/json"},
                ),
                timeout=60,
            )
            return response.text or ""

        response = await asyncio.wait_for(
            asyncio.to_thread(
                self._legacy_model.generate_content,
                combined,
                generation_config={"response_mime_type": "application/json", "temperature": 0.4},
            ),
            timeout=60,
        )
        return response.text or ""


# ── Simulated Provider ──────────────────────────────────────

class SimulatedProvider(BaseAIProvider):
    """
    Intelligent template-based provider that produces realistic structured
    output without any API key. Uses the feature request text to generate
    contextually relevant responses.
    """

    provider_name = "simulated"

    def __init__(self, fallback_reason: str | None = None) -> None:
        self.fallback_reason = fallback_reason

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        # Simulate a short processing delay for realism
        await asyncio.sleep(1.5)

        # Determine which stage we're generating for based on system prompt keywords
        prompt_lower = system_prompt.lower()

        if "requirements analyst" in prompt_lower:
            return self._requirements_response(user_prompt)
        elif "solutions architect" in prompt_lower or "solution architecture" in prompt_lower:
            return self._design_response(user_prompt)
        elif "technical project manager" in prompt_lower or "implementation plan" in prompt_lower:
            return self._implementation_response(user_prompt)
        elif "code review" in prompt_lower:
            return self._review_response(user_prompt)
        else:
            return json.dumps({"summary": "Processed successfully", "details": user_prompt[:200]})

    def _extract_feature_name(self, text: str) -> str:
        """Extract a short feature name from the request text."""
        feature_request = self._extract_original_feature_request(text)
        words = re.findall(r"[A-Za-z0-9+#./-]+", feature_request)[:7]
        return " ".join(words).strip(".,!?") or "Requested Feature"

    def _extract_original_feature_request(self, text: str) -> str:
        """Pull the original request out of a stage prompt."""
        marker = "ORIGINAL FEATURE REQUEST:"
        if marker in text:
            tail = text.split(marker, 1)[1]
            stop_markers = [
                "\n\nREQUIREMENTS ANALYSIS:",
                "\n\nSOLUTION DESIGN:",
                "\n\nIMPLEMENTATION PLAN:",
                "\n\nRespond with",
            ]
            for stop in stop_markers:
                if stop in tail:
                    tail = tail.split(stop, 1)[0]
            return tail.strip()

        marker = "FEATURE REQUEST:"
        if marker in text:
            tail = text.split(marker, 1)[1]
            if "\n\nRespond with" in tail:
                tail = tail.split("\n\nRespond with", 1)[0]
            return tail.strip()

        return text.strip()

    def _domain_terms(self, text: str) -> dict[str, str]:
        """Infer lightweight implementation hints from the request text."""
        feature_request = self._extract_original_feature_request(text)
        lowered = feature_request.lower()
        if any(term in lowered for term in ["auth", "login", "oauth", "webauthn", "passkey"]):
            return {
                "domain": "authentication",
                "entity": "Credential",
                "frontend": "Next.js secure account UI",
                "backend": "FastAPI auth service",
                "database": "User, Credential, Session, AuditLog",
                "integration": "identity provider and secure session store",
            }
        if any(term in lowered for term in ["payment", "stripe", "billing", "invoice", "subscription"]):
            return {
                "domain": "billing",
                "entity": "Subscription",
                "frontend": "Next.js billing workspace",
                "backend": "FastAPI billing orchestration service",
                "database": "Customer, Subscription, Invoice, UsageEvent",
                "integration": "Stripe webhooks and reconciliation jobs",
            }
        if any(term in lowered for term in ["chat", "websocket", "real-time", "realtime", "notification"]):
            return {
                "domain": "real-time collaboration",
                "entity": "Event",
                "frontend": "Next.js live activity UI",
                "backend": "FastAPI websocket and event service",
                "database": "Channel, Event, DeliveryReceipt, Presence",
                "integration": "Redis Pub/Sub and durable event storage",
            }
        if any(term in lowered for term in ["gnn", "graph neural", "email triage", "email priority", "inbox"]):
            return {
                "domain": "GNN-based email triage",
                "entity": "EmailTriagePrediction",
                "frontend": "Next.js inbox prioritization dashboard",
                "backend": "FastAPI ML inference and triage service",
                "database": "Email, Sender, Recipient, InteractionEdge, TriagePrediction",
                "integration": "email provider APIs, graph feature store, and model inference runtime",
            }
        return {
            "domain": "software feature delivery",
            "entity": "FeatureArtifact",
            "frontend": "Next.js product UI",
            "backend": "FastAPI application service",
            "database": "Feature, Task, AuditLog",
            "integration": "AI provider and persistence layer",
        }

    def _requirements_response(self, feature_request: str) -> str:
        feature = self._extract_feature_name(feature_request)
        terms = self._domain_terms(feature_request)
        original = self._extract_original_feature_request(feature_request)
        return json.dumps({
            "summary": f"Requirements analysis for: {feature}",
            "functional_requirements": [
                {
                    "id": "FR-001",
                    "title": f"Core {terms['domain']} workflow",
                    "description": f"The system shall implement the requested workflow: {original[:220]}",
                    "priority": "High",
                    "acceptance_criteria": [
                        "User can complete the main workflow from the primary interface",
                        "Required validations and failure paths are handled with clear feedback",
                        "Successful operations produce a persisted, auditable result"
                    ]
                },
                {
                    "id": "FR-002",
                    "title": "Workflow visibility",
                    "description": "The system shall expose each analysis, design, planning, and review stage with status, timing, and generated artifacts.",
                    "priority": "High",
                    "acceptance_criteria": [
                        "Each stage has pending, running, completed, and failed states",
                        "The user can inspect generated artifacts per stage",
                        "Errors identify the failed stage and cause"
                    ]
                },
                {
                    "id": "FR-003",
                    "title": "Artifact persistence and retrieval",
                    "description": "All workflow inputs, stage outputs, and final review recommendations shall be persisted and retrievable across sessions.",
                    "priority": "Medium",
                    "acceptance_criteria": [
                        "Data survives page refresh",
                        "Historical records are browsable",
                        "Data can be exported"
                    ]
                }
            ],
            "non_functional_requirements": [
                {"id": "NFR-001", "category": "Performance", "description": "Persist workflow state immediately and stream stage updates without blocking the request thread", "priority": "High"},
                {"id": "NFR-002", "category": "Security", "description": "Treat feature requests as untrusted input and isolate them from agent instructions", "priority": "High"},
                {"id": "NFR-003", "category": "Reliability", "description": "Recover from malformed model output with validation, retry, and structured failure messages", "priority": "High"},
                {"id": "NFR-004", "category": "Accessibility", "description": "Expose readable status and artifact content for assistive technologies", "priority": "Medium"}
            ],
            "user_stories": [
                f"As a product owner, I want a structured breakdown for {feature.lower()} so that engineering work starts from clear scope.",
                "As an engineer, I want architecture and implementation artifacts linked to requirements so that I can plan work confidently.",
                "As a reviewer, I want risks and quality checks surfaced early so that design issues are caught before code is written."
            ],
            "risk_assessment": [
                {"risk": "Scope creep from ambiguous requirements", "impact": "High", "mitigation": "Define clear acceptance criteria per requirement"},
                {"risk": "Model output drift or invalid JSON", "impact": "Medium", "mitigation": "Validate each agent response and retry with a strict repair prompt"},
                {"risk": "Third-party API dependency", "impact": "Medium", "mitigation": "Keep simulated mode available for demos and add provider timeouts"}
            ],
            "priority_classification": "High - Core workflow required by the project statement"
        }, indent=2)

    def _design_response(self, feature_request: str) -> str:
        feature = self._extract_feature_name(feature_request)
        terms = self._domain_terms(feature_request)
        return json.dumps({
            "summary": f"Solution architecture for: {feature}",
            "architecture_pattern": "Agentic Pipeline with Validated Stage Artifacts",
            "architecture_rationale": "Specialized agents keep the workflow explainable while the orchestrator handles dependency order, state persistence, retries, and live progress events.",
            "component_diagram": f"graph TD\n    A[\"{terms['frontend']}\"] --> B[\"Workflow API\"]\n    B --> C[\"Pipeline Orchestrator\"]\n    C --> D1[\"Requirements Agent\"]\n    D1 --> D2[\"Design Agent\"]\n    D2 --> D3[\"Implementation Agent\"]\n    D3 --> D4[\"Review Agent\"]\n    D1 --> E[\"Artifact Store\"]\n    D2 --> E\n    D3 --> E\n    D4 --> E\n    C -->|SSE status events| A\n    C --> F[\"{terms['integration']}\"]",
            "technology_stack": {
                "frontend": {"framework": "Next.js", "styling": "Tailwind CSS", "state": "React hooks and SSE subscription state"},
                "backend": {"framework": terms["backend"], "database": f"SQLite via SQLAlchemy async ({terms['database']})", "ai_integration": "OpenAI, Gemini, or simulated provider"},
                "communication": {"rest_api": "JSON over HTTPS", "real_time": "Server-Sent Events (SSE)"}
            },
            "api_contracts": [
                {"method": "POST", "endpoint": "/api/workflows", "description": "Create and trigger a new workflow pipeline"},
                {"method": "GET", "endpoint": "/api/workflows", "description": "List all workflows with pagination"},
                {"method": "GET", "endpoint": "/api/workflows/{id}", "description": "Get full workflow detail with stage results"},
                {"method": "GET", "endpoint": "/api/workflows/{id}/stream", "description": "SSE stream for real-time pipeline updates"},
                {"method": "GET", "endpoint": "/api/workflows/{id}/export", "description": "Export workflow as Markdown report"},
                {"method": "DELETE", "endpoint": "/api/workflows/{id}", "description": "Delete a workflow"}
            ],
            "data_model": {
                "Workflow": {"fields": ["id (PK)", "feature_request (TEXT)", "status (ENUM)", "created_at", "updated_at"]},
                "StageResult": {"fields": ["id (PK)", "workflow_id (FK)", "stage_name", "status", "input_context", "output (JSON)", "duration_seconds"]},
                terms["entity"]: {"fields": ["id (PK)", "owner_id", "status", "metadata", "created_at", "updated_at"]}
            },
            "design_decisions": [
                "Use one specialized agent per deliverable to keep decomposition visible",
                "Validate and normalize JSON before persistence so the frontend can render stable artifacts",
                "SSE is sufficient for unidirectional progress updates and simpler than WebSockets for this workflow"
            ]
        }, indent=2)

    def _implementation_response(self, feature_request: str) -> str:
        feature = self._extract_feature_name(feature_request)
        terms = self._domain_terms(feature_request)
        return json.dumps({
            "summary": f"Implementation plan for: {feature}",
            "milestones": [
                {
                    "id": "M1",
                    "title": "Domain Model and API Foundation",
                    "target": "Sprint 1",
                    "tasks": [
                        {"id": "T-101", "title": f"Define {terms['database']} persistence models", "effort": "4h", "priority": "Critical", "dependencies": []},
                        {"id": "T-102", "title": "Create request and response schemas with validation", "effort": "3h", "priority": "Critical", "dependencies": ["T-101"]},
                        {"id": "T-103", "title": "Implement REST endpoints and service-layer orchestration", "effort": "6h", "priority": "Critical", "dependencies": ["T-102"]},
                        {"id": "T-104", "title": f"Integrate {terms['integration']}", "effort": "5h", "priority": "High", "dependencies": ["T-103"]}
                    ]
                },
                {
                    "id": "M2",
                    "title": "Agentic Workflow Execution",
                    "target": "Sprint 2",
                    "tasks": [
                        {"id": "T-201", "title": "Implement dependency-aware pipeline orchestration", "effort": "6h", "priority": "Critical", "dependencies": ["T-103"]},
                        {"id": "T-202", "title": "Add stage-specific prompt templates and required output schemas", "effort": "4h", "priority": "High", "dependencies": ["T-201"]},
                        {"id": "T-203", "title": "Normalize, validate, and retry malformed model JSON", "effort": "4h", "priority": "High", "dependencies": ["T-202"]},
                        {"id": "T-204", "title": "Persist input context and generated artifacts for every stage", "effort": "3h", "priority": "High", "dependencies": ["T-201"]},
                        {"id": "T-205", "title": "Stream stage telemetry through SSE", "effort": "4h", "priority": "High", "dependencies": ["T-204"]}
                    ]
                },
                {
                    "id": "M3",
                    "title": "Review, Testing, and Demo Hardening",
                    "target": "Sprint 3",
                    "tasks": [
                        {"id": "T-301", "title": "Add unit tests for provider fallback and JSON normalization", "effort": "4h", "priority": "High", "dependencies": ["T-203"]},
                        {"id": "T-302", "title": "Add integration tests for workflow creation, polling, and export", "effort": "5h", "priority": "High", "dependencies": ["T-205"]},
                        {"id": "T-303", "title": "Exercise no-key simulated mode for presentation reliability", "effort": "2h", "priority": "Medium", "dependencies": ["T-301"]},
                        {"id": "T-304", "title": "Document environment variables and provider setup", "effort": "2h", "priority": "Medium", "dependencies": ["T-302"]}
                    ]
                }
            ],
            "testing_strategy": {
                "unit_tests": "pytest for service logic, feature extraction, agent validation, and provider fallback",
                "integration_tests": "FastAPI TestClient for API endpoint validation and persisted workflow artifacts",
                "e2e_tests": "Manual verification of full pipeline flow with representative feature requests",
                "coverage_target": "80% for backend business logic and critical orchestration paths"
            },
            "dependency_graph": "graph LR\n    T101[\"Scaffolding\"] --> T102[\"DB Models\"]\n    T101 --> T104[\"AI Provider\"]\n    T102 --> T103[\"REST API\"]\n    T103 --> T201[\"Orchestrator\"]\n    T104 --> T201\n    T201 --> T202[\"Req Agent\"]\n    T201 --> T203[\"Design Agent\"]\n    T201 --> T204[\"Impl Agent\"]\n    T201 --> T205[\"Review Agent\"]\n    T201 --> T206[\"SSE Stream\"]\n    T301[\"React App\"] --> T302[\"Components\"]\n    T302 --> T303[\"Visualizer\"]\n    T206 --> T304[\"SSE Hook\"]\n    T301 --> T304\n    T303 --> T305[\"History/Export\"]",
            "total_estimated_effort": "52 hours across 3 sprints"
        }, indent=2)

    def _review_response(self, feature_request: str) -> str:
        feature = self._extract_feature_name(feature_request)
        terms = self._domain_terms(feature_request)
        return json.dumps({
            "summary": f"Code review guidelines for: {feature}",
            "code_quality_checklist": [
                {"item": "Stage contract validation", "status": "Pass", "details": "Every agent output should be valid JSON with required top-level keys before persistence"},
                {"item": "Dependency handling", "status": "Pass", "details": "Agents should only run when their prerequisite stage artifacts exist"},
                {"item": "Error handling", "status": "Review", "details": "Provider errors, missing API keys, timeouts, and malformed model output need structured user-visible failures"},
                {"item": "Input validation", "status": "Review", "details": f"Validate all fields that create or mutate {terms['entity']} records"},
                {"item": "Observability", "status": "Review", "details": "Capture stage duration, input context, status transitions, and provider mode for debugging"}
            ],
            "potential_anti_patterns": [
                {"pattern": "Hidden monolithic agent", "risk": "High", "location": "Pipeline layer", "recommendation": "Keep requirements, design, implementation, and review agents separate with explicit dependencies"},
                {"pattern": "Unvalidated LLM output", "risk": "High", "location": "AI provider boundary", "recommendation": "Parse and validate JSON before storing or streaming it"},
                {"pattern": "Silent provider misconfiguration", "risk": "Medium", "location": "Provider factory", "recommendation": "Expose fallback mode and fail gracefully when keys are absent"},
                {"pattern": "Stringly typed statuses", "risk": "Low", "location": "Workflow and stage status fields", "recommendation": "Consider promoting statuses to enums if the project grows"}
            ],
            "security_review": [
                {"concern": "Prompt injection", "severity": "High", "recommendation": "Keep user feature text inside clearly labeled prompt sections and preserve system instructions"},
                {"concern": "API key exposure", "severity": "High", "recommendation": "Load keys from environment variables only and never return them through health or workflow APIs"},
                {"concern": "CORS configuration", "severity": "Medium", "recommendation": "Restrict origins to local frontend URLs for demos and known domains for deployment"},
                {"concern": "Sensitive artifact storage", "severity": "Medium", "recommendation": "Avoid storing secrets in feature requests and add retention controls for production"}
            ],
            "performance_considerations": [
                {"area": "Database queries", "recommendation": "Add indexes on workflow.status and workflow.created_at for list/filter queries"},
                {"area": "SSE connections", "recommendation": "Implement connection cleanup on client disconnect to prevent resource leaks"},
                {"area": "AI response caching", "recommendation": "Consider caching identical feature requests to avoid redundant API calls"},
                {"area": "Concurrent workflows", "recommendation": "Use asyncio task groups to handle multiple simultaneous pipeline runs"}
            ],
            "suggested_review_workflow": [
                "1. Start with schema validation — ensure Pydantic models match DB models",
                "2. Review AI prompt templates for clarity and output format instructions",
                "3. Test error paths — disconnect AI, corrupt input, exceed rate limits",
                "4. Verify SSE cleanup — ensure no zombie connections on page navigation",
                "5. Security audit — check all user inputs reach the AI layer sanitized"
            ],
            "overall_assessment": "The architecture is appropriate for the assignment when each stage is independently visible, dependency-aware, and validated. The highest-value hardening is provider fallback, JSON validation, and explicit stage telemetry."
        }, indent=2)


class MisconfiguredProvider(BaseAIProvider):
    """Provider used when a requested external AI backend is not configured."""

    provider_name = "misconfigured"

    def __init__(self, message: str) -> None:
        self.fallback_reason = message

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        raise RuntimeError(self.fallback_reason)


# ── Factory ─────────────────────────────────────────────────

def get_ai_provider() -> BaseAIProvider:
    """Factory that returns the configured AI provider."""
    provider = settings.AI_PROVIDER.lower()
    try:
        if provider == "auto":
            if settings.OPENAI_API_KEY:
                return OpenAIProvider()
            if settings.GEMINI_API_KEY:
                return GeminiProvider()
            return SimulatedProvider()
        if provider == "openai":
            return OpenAIProvider()
        if provider == "gemini":
            return GeminiProvider()
        if provider == "simulated":
            return SimulatedProvider()
        return MisconfiguredProvider(
            f"Unsupported AI_PROVIDER={settings.AI_PROVIDER!r}. Use openai, gemini, simulated, or auto."
        )
    except Exception as exc:
        return MisconfiguredProvider(str(exc))
