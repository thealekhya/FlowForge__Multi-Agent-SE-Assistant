"""
FlowForge AI — Pydantic Output Schemas for LangChain Structured Output

These models define the exact JSON schema each agent must produce.
Used with `llm.with_structured_output(Model)` for Pydantic-enforced output.

When the LLM provider does not support native structured output (e.g.
the simulated provider), nodes fall back to raw JSON parsing.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Shared Models ───────────────────────────────────────────

class WebSource(BaseModel):
    title: str = Field(default="Technical Documentation", description="Title of the web source")
    url: str = Field(description="Direct URL to source or documentation")
    domain: str = Field(default="", description="Domain name (e.g. github.com)")
    snippet: str = Field(default="", description="Technical excerpt or context")


# ── Stage 1: Requirements ───────────────────────────────────

class FunctionalRequirement(BaseModel):
    id: str = Field(description="Unique requirement ID like FR-001")
    title: str = Field(description="Short requirement title")
    description: str = Field(description="Detailed requirement description")
    priority: str = Field(description="High, Medium, or Low")
    acceptance_criteria: list[str] = Field(default_factory=list, description="List of acceptance criteria")

class NonFunctionalRequirement(BaseModel):
    id: str = Field(description="Unique requirement ID like NFR-001")
    category: str = Field(description="Performance, Security, Scalability, or Accessibility")
    description: str = Field(description="NFR description")
    priority: str = Field(description="High, Medium, or Low")

class RiskItem(BaseModel):
    risk: str = Field(description="Risk description")
    impact: str = Field(description="High, Medium, or Low")
    mitigation: str = Field(description="Mitigation strategy")

class RequirementsOutput(BaseModel):
    summary: str = Field(description="One-line summary of the feature")
    functional_requirements: list[FunctionalRequirement] = Field(default_factory=list)
    non_functional_requirements: list[NonFunctionalRequirement] = Field(default_factory=list)
    user_stories: list[str] = Field(default_factory=list)
    risk_assessment: list[RiskItem] = Field(default_factory=list)
    priority_classification: str = Field(default="Medium", description="High|Medium|Low with justification")
    web_sources: list[WebSource] = Field(default_factory=list, description="Verified live web sources and citations")


# ── Stage 2: Design ─────────────────────────────────────────

class TechStackLayer(BaseModel):
    framework: Optional[str] = None
    styling: Optional[str] = None
    state: Optional[str] = None
    database: Optional[str] = None
    ai_integration: Optional[str] = None
    rest_api: Optional[str] = None
    real_time: Optional[str] = None

class ApiContract(BaseModel):
    method: str = Field(description="GET, POST, PUT, or DELETE")
    endpoint: str = Field(description="API endpoint path")
    description: str = Field(description="What this endpoint does")

class DesignOutput(BaseModel):
    summary: str = Field(description="One-line architecture summary")
    architecture_pattern: str = Field(description="E.g. Layered, Microservices, Event-Driven")
    architecture_rationale: str = Field(description="Why this pattern was chosen")
    component_diagram: str = Field(default="", description="Mermaid graph TD diagram as a string")
    technology_stack: dict[str, TechStackLayer] = Field(default_factory=dict)
    api_contracts: list[ApiContract] = Field(default_factory=list)
    data_model: dict = Field(default_factory=dict)
    design_decisions: list[str] = Field(default_factory=list)
    web_sources: list[WebSource] = Field(default_factory=list, description="Verified documentation, benchmarks, and library sources")


# ── Stage 3: Implementation ─────────────────────────────────

class Task(BaseModel):
    id: str = Field(description="Task ID like T-101")
    title: str = Field(description="Task title")
    effort: str = Field(description="Estimated hours, e.g. 4h")
    priority: str = Field(description="Critical, High, Medium, or Low")
    dependencies: list[str] = Field(default_factory=list)

class Milestone(BaseModel):
    id: str = Field(description="Milestone ID like M1")
    title: str = Field(description="Milestone title")
    target: str = Field(description="Sprint or timeline target")
    tasks: list[Task] = Field(default_factory=list)

class TestingStrategy(BaseModel):
    unit_tests: str = ""
    integration_tests: str = ""
    e2e_tests: str = ""
    coverage_target: str = ""

class ImplementationOutput(BaseModel):
    summary: str = Field(description="One-line implementation plan summary")
    milestones: list[Milestone] = Field(default_factory=list)
    testing_strategy: Optional[TestingStrategy] = None
    dependency_graph: str = Field(default="", description="Mermaid graph LR diagram string")
    total_estimated_effort: str = Field(default="", description="Total hours estimate")


# ── Stage 4: Review ──────────────────────────────────────────

class QualityCheckItem(BaseModel):
    item: str = Field(description="Check item name")
    status: str = Field(description="Pass, Review, or Fail")
    details: str = Field(description="Explanation")

class AntiPattern(BaseModel):
    pattern: str = Field(description="Anti-pattern name")
    risk: str = Field(description="High, Medium, or Low")
    location: str = Field(description="Where it might occur")
    recommendation: str = Field(description="How to fix")

class SecurityConcern(BaseModel):
    concern: str = Field(description="Security concern")
    severity: str = Field(description="High, Medium, or Low")
    recommendation: str = Field(description="Mitigation approach")

class PerformanceItem(BaseModel):
    area: str = Field(description="Performance area")
    recommendation: str = Field(description="Optimization suggestion")

class ReviewOutput(BaseModel):
    summary: str = Field(description="One-line review summary")
    code_quality_checklist: list[QualityCheckItem] = Field(default_factory=list)
    potential_anti_patterns: list[AntiPattern] = Field(default_factory=list)
    security_review: list[SecurityConcern] = Field(default_factory=list)
    performance_considerations: list[PerformanceItem] = Field(default_factory=list)
    suggested_review_workflow: list[str] = Field(default_factory=list)
    overall_assessment: str = Field(default="")
