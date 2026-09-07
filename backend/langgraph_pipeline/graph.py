"""
FlowForge AI — LangGraph DAG Definition

Constructs a compiled StateGraph that wires the 4 agent nodes
in a sequential pipeline:

    requirements → design → implementation → review → END

Each node is an async function that reads its dependencies from
the shared WorkflowState and writes its output key.
"""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from langgraph_pipeline.nodes.requirements_node import requirements_node
from langgraph_pipeline.nodes.design_node import design_node
from langgraph_pipeline.nodes.implementation_node import implementation_node
from langgraph_pipeline.nodes.review_node import review_node
from langgraph_pipeline.state import WorkflowState


def build_graph() -> StateGraph:
    """
    Construct and compile the 4-stage multi-agent pipeline.

    Returns a compiled LangGraph that can be invoked with:
        result = await graph.ainvoke({"feature_request": "..."})
    or streamed with:
        async for event in graph.astream({"feature_request": "..."}):
            ...
    """
    graph = StateGraph(WorkflowState)

    # ── Register Nodes ──────────────────────────────────────
    graph.add_node("requirements", requirements_node)
    graph.add_node("design", design_node)
    graph.add_node("implementation", implementation_node)
    graph.add_node("review", review_node)

    # ── Wire the DAG ────────────────────────────────────────
    graph.set_entry_point("requirements")
    graph.add_edge("requirements", "design")
    graph.add_edge("design", "implementation")
    graph.add_edge("implementation", "review")
    graph.add_edge("review", END)

    return graph.compile()


# Module-level singleton — compiled once, reused across requests
pipeline = build_graph()
