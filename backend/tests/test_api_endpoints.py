import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Verify the /api/health endpoint returns 200 and reports configured AI engine."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FlowForge AI"
    assert "configured_ai_provider" in data
    assert "effective_ai_provider" in data


@pytest.mark.asyncio
async def test_multi_tenant_user_isolation(client: AsyncClient):
    """
    Verify strict tenant isolation:
    1. Account A creates a workflow.
    2. Account A can see its workflow in the list.
    3. Account B CANNOT see Account A's workflow in the list.
    4. Account B receives 404 when directly requesting Account A's workflow.
    5. Account B receives 403 when attempting to delete Account A's workflow.
    6. Account A successfully deletes its own workflow (204).
    """
    user_a = "test_user_alpha_cadence"
    user_b = "test_user_beta_cadence"

    # 1. User A creates a workflow
    create_resp = await client.post(
        "/api/workflows",
        json={"feature_request": "Implement high-throughput Kafka event streaming engine"},
        headers={"X-User-Id": user_a},
    )
    assert create_resp.status_code == 201
    created_wf = create_resp.json()
    wf_id = created_wf["id"]
    assert created_wf["user_id"] == user_a
    assert created_wf["status"] == "pending"

    # 2. User A queries list -> sees its own workflow
    list_a = await client.get("/api/workflows", headers={"X-User-Id": user_a})
    assert list_a.status_code == 200
    wfs_a = list_a.json()
    assert any(w["id"] == wf_id for w in wfs_a)

    # 3. User B queries list -> CANNOT see User A's workflow
    list_b = await client.get("/api/workflows", headers={"X-User-Id": user_b})
    assert list_b.status_code == 200
    wfs_b = list_b.json()
    assert not any(w["id"] == wf_id for w in wfs_b)

    # 4. User B attempts direct GET -> receives 404 Not Found
    get_b = await client.get(f"/api/workflows/{wf_id}", headers={"X-User-Id": user_b})
    assert get_b.status_code == 404

    # 5. User B attempts DELETE -> receives 403 Forbidden
    del_b = await client.delete(f"/api/workflows/{wf_id}", headers={"X-User-Id": user_b})
    assert del_b.status_code == 403

    # 6. User A deletes its own workflow -> receives 204 No Content
    del_a = await client.delete(f"/api/workflows/{wf_id}", headers={"X-User-Id": user_a})
    assert del_a.status_code == 204


@pytest.mark.asyncio
async def test_guest_unauthenticated_isolation(client: AsyncClient):
    """Verify that unauthenticated guest calls only return unassigned demo workflows."""
    response = await client.get("/api/workflows")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # All workflows returned to guests must have user_id = None
    for item in data:
        assert item["user_id"] is None
