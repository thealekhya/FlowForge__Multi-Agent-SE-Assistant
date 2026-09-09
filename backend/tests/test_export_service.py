import pytest
from models.workflow import Workflow, StageResult
from services.export_service import (
    generate_markdown_report,
    generate_pdf_report,
    generate_docx_report,
)


@pytest.fixture
def mock_workflow():
    """Builds a mock workflow with 4 completed stages for export verification."""
    wf = Workflow(
        id="test_export_wf_001",
        feature_request="Build high-performance distributed caching cluster",
        status="completed",
        user_id="test_user",
    )
    s1 = StageResult(
        workflow_id=wf.id,
        stage_name="requirements",
        order_index=0,
        status="completed",
        input_context="{}",
        output='{"functional_requirements": ["High throughput", "Low latency"], "user_stories": ["As an engineer..."]}',
        duration_seconds=1.2,
    )
    s2 = StageResult(
        workflow_id=wf.id,
        stage_name="design",
        order_index=1,
        status="completed",
        input_context="{}",
        output='{"architecture_overview": "Redis cluster with Sentinel", "mermaid_diagram": "graph TD; A-->B"}',
        duration_seconds=1.5,
    )
    s3 = StageResult(
        workflow_id=wf.id,
        stage_name="implementation",
        order_index=2,
        status="completed",
        input_context="{}",
        output='{"file_tree": ["src/cache.py"], "code_files": [{"path": "src/cache.py", "content": "# Cache implementation"}]}',
        duration_seconds=2.0,
    )
    s4 = StageResult(
        workflow_id=wf.id,
        stage_name="review",
        order_index=3,
        status="completed",
        input_context="{}",
        output='{"security_audit": "OWASP Compliant", "test_plan": "Unit tests for cache eviction"}',
        duration_seconds=1.1,
    )
    wf.stages = [s1, s2, s3, s4]
    return wf


def test_markdown_report_generation(mock_workflow):
    """Verify Markdown report compiles with headers, metadata, and stage details."""
    md = generate_markdown_report(mock_workflow)
    assert isinstance(md, str)
    assert "# FlowForge AI" in md
    assert "test_export_wf_001" in md
    assert "Build high-performance distributed caching cluster" in md
    assert "Requirements" in md
    assert "Design" in md
    assert "Implementation" in md
    assert "Review" in md


def test_pdf_report_generation(mock_workflow):
    """Verify ReportLab compiles an in-memory binary PDF buffer."""
    pdf_bytes = generate_pdf_report(mock_workflow)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # PDF standard magic header bytes: %PDF-
    assert pdf_bytes.startswith(b"%PDF-")


def test_docx_report_generation(mock_workflow):
    """Verify python-docx compiles an in-memory OpenXML Word document."""
    docx_bytes = generate_docx_report(mock_workflow)
    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 1000
    # Standard OpenXML ZIP magic header bytes: PK\x03\x04
    assert docx_bytes.startswith(b"PK\x03\x04")
