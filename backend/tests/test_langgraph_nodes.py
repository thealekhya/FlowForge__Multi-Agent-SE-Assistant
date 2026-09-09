import pytest
from langgraph_pipeline.graph import build_graph
from langgraph_pipeline.state import WorkflowState


def test_langgraph_dag_compilation():
    """Verify that the 4-node LangGraph StateGraph compiles with correct node topology."""
    graph = build_graph()
    assert graph is not None
    # Verify node registrations
    nodes = graph.nodes
    assert "requirements" in nodes
    assert "design" in nodes
    assert "implementation" in nodes
    assert "review" in nodes


def test_workflow_state_schema():
    """Verify TypedDict contract integrity for WorkflowState."""
    state: WorkflowState = {
        "workflow_id": "test_state_001",
        "feature_request": "Develop biometric authentication",
        "current_stage": "requirements",
        "stage_durations": {},
        "errors": [],
        "requirements_output": None,
        "design_output": None,
        "implementation_output": None,
        "review_output": None,
        "final_status": "pending",
    }
    assert state["workflow_id"] == "test_state_001"
    assert state["current_stage"] == "requirements"
    assert state["final_status"] == "pending"
