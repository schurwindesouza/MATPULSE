import pytest
from tests.conftest import client


@pytest.fixture
def sample_review_materials():
    """Seed three distinct CPSE materials into test database."""
    m_data = [
        {
            "cpse": "BHEL",
            "material_code": "WF-BHEL-01",
            "description": "SS HEX BOLT M10 X 50",
            "category": "Fasteners",
            "uom": "EA",
        },
        {
            "cpse": "NTPC",
            "material_code": "WF-NTPC-01",
            "description": "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM",
            "category": "Fasteners",
            "uom": "PCS",
        },
        {
            "cpse": "SAIL",
            "material_code": "WF-SAIL-01",
            "description": "MILD STEEL HEX BOLT M10 X 50",
            "category": "Fasteners",
            "uom": "EA",
        },
    ]
    created = []
    for item in m_data:
        res = client.post("/api/v1/materials/", json=item)
        assert res.status_code == 201
        created.append(res.json())
    return created


def test_generate_and_persist_matches(sample_review_materials):
    """
    Test 1:
    POST /api/v1/matching/generate creates pending match recommendations
    and leaves material master records untouched.
    """
    res = client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["matches_created"] >= 1
    assert data["matches_skipped"] == 0
    assert data["total_candidates"] >= 1

    # Verify material records are still UNMATCHED and common_material_code is None
    for mat in sample_review_materials:
        get_res = client.get(f"/api/v1/materials/{mat['id']}")
        assert get_res.status_code == 200
        mat_db = get_res.json()
        assert mat_db["matching_status"] == "UNMATCHED"
        assert mat_db["common_material_code"] is None
        assert mat_db["material_code"] == mat["material_code"]


def test_duplicate_prevention_on_generate(sample_review_materials):
    """
    Test 2:
    Repeated generation does not duplicate recommendations.
    Existing matches are skipped.
    """
    # First generation
    res1 = client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )
    assert res1.status_code == 201
    initial_created = res1.json()["matches_created"]
    assert initial_created >= 1

    # Second generation
    res2 = client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["matches_created"] == 0
    assert data2["matches_skipped"] == initial_created


def test_review_queue_and_filters(sample_review_materials):
    """
    Test 3:
    GET /api/v1/matching/review-queue returns items and respects filters.
    """
    client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 60.0},
    )

    # Fetch all items in review queue
    q_res = client.get("/api/v1/matching/review-queue")
    assert q_res.status_code == 200
    queue = q_res.json()
    assert len(queue) >= 1

    # Each queue item must have both material summaries
    first = queue[0]
    assert "material_a" in first
    assert "material_b" in first
    assert first["status"] == "PENDING"
    assert first["final_confidence"] >= 60.0

    # Filter by status
    pending_res = client.get("/api/v1/matching/review-queue?status=PENDING")
    assert pending_res.status_code == 200
    for item in pending_res.json():
        assert item["status"] == "PENDING"

    # Filter by status alias PENDING_REVIEW
    pending_review_res = client.get("/api/v1/matching/review-queue?status=PENDING_REVIEW")
    assert pending_review_res.status_code == 200
    assert len(pending_review_res.json()) == len(pending_res.json())

    # Filter by non-existent status
    approved_res = client.get("/api/v1/matching/review-queue?status=APPROVED")
    assert approved_res.status_code == 200
    assert len(approved_res.json()) == 0

    # Filter by min_confidence
    high_conf_res = client.get("/api/v1/matching/review-queue?min_confidence=90.0")
    assert high_conf_res.status_code == 200
    for item in high_conf_res.json():
        assert item["final_confidence"] >= 90.0

    # Filter by CPSE
    cpse_res = client.get("/api/v1/matching/review-queue?cpse=BHEL")
    assert cpse_res.status_code == 200
    for item in cpse_res.json():
        cpses = [item["material_a"]["cpse"], item["material_b"]["cpse"]]
        assert "BHEL" in cpses


def test_match_details(sample_review_materials):
    """
    Test 4:
    GET /api/v1/matching/{match_id} returns detailed explainability metrics and full materials.
    """
    client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )

    queue = client.get("/api/v1/matching/review-queue").json()
    assert len(queue) >= 1
    match_id = queue[0]["id"]

    detail_res = client.get(f"/api/v1/matching/{match_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()

    assert detail["id"] == match_id
    assert detail["status"] == "PENDING"
    assert "semantic_score" in detail
    assert "technical_score" in detail
    assert "category_score" in detail
    assert "uom_score" in detail
    assert "attribute_comparison" in detail
    assert "reasons" in detail
    assert "warnings" in detail
    assert "material_a" in detail
    assert "material_b" in detail
    assert detail["material_a"]["material_code"] in ["WF-BHEL-01", "WF-NTPC-01", "WF-SAIL-01"]


def test_approve_match_workflow(sample_review_materials):
    """
    Test 5:
    POST /api/v1/matching/{match_id}/approve assigns Common Material Code,
    sets matching_status to MATCHED, and strictly preserves original CPSE codes.
    """
    client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )

    queue = client.get("/api/v1/matching/review-queue").json()
    match_id = queue[0]["id"]
    mat_a_id = queue[0]["material_a"]["id"]
    mat_b_id = queue[0]["material_b"]["id"]
    mat_a_orig_code = queue[0]["material_a"]["material_code"]
    mat_b_orig_code = queue[0]["material_b"]["material_code"]

    common_code = "NMC-DEMO-BOLT-M10"
    approve_res = client.post(
        f"/api/v1/matching/{match_id}/approve",
        json={"common_material_code": common_code},
    )
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] == "APPROVED"
    assert approved_data["common_material_code"] == common_code
    assert approved_data["reviewed_at"] is not None

    # Verify Material A master record
    mat_a_res = client.get(f"/api/v1/materials/{mat_a_id}")
    assert mat_a_res.status_code == 200
    mat_a = mat_a_res.json()
    assert mat_a["matching_status"] == "MATCHED"
    assert mat_a["common_material_code"] == common_code
    # Original material_code must NOT be overwritten
    assert mat_a["material_code"] == mat_a_orig_code

    # Verify Material B master record
    mat_b_res = client.get(f"/api/v1/materials/{mat_b_id}")
    assert mat_b_res.status_code == 200
    mat_b = mat_b_res.json()
    assert mat_b["matching_status"] == "MATCHED"
    assert mat_b["common_material_code"] == common_code
    # Original material_code must NOT be overwritten
    assert mat_b["material_code"] == mat_b_orig_code


def test_reject_match_workflow(sample_review_materials):
    """
    Test 6:
    POST /api/v1/matching/{match_id}/reject sets status to REJECTED
    and does NOT modify material master records.
    """
    client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )

    queue = client.get("/api/v1/matching/review-queue").json()
    match_id = queue[0]["id"]
    mat_a_id = queue[0]["material_a"]["id"]
    mat_b_id = queue[0]["material_b"]["id"]

    rejection_reason = "Different application environments (high temperature vs ambient)."
    reject_res = client.post(
        f"/api/v1/matching/{match_id}/reject",
        json={"reason": rejection_reason},
    )
    assert reject_res.status_code == 200
    rejected_data = reject_res.json()
    assert rejected_data["status"] == "REJECTED"
    assert rejected_data["rejection_reason"] == rejection_reason
    assert rejected_data["reviewed_at"] is not None

    # Verify Material A was NOT modified
    mat_a = client.get(f"/api/v1/materials/{mat_a_id}").json()
    assert mat_a["matching_status"] == "UNMATCHED"
    assert mat_a["common_material_code"] is None

    # Verify Material B was NOT modified
    mat_b = client.get(f"/api/v1/materials/{mat_b_id}").json()
    assert mat_b["matching_status"] == "UNMATCHED"
    assert mat_b["common_material_code"] is None


def test_match_not_found_endpoints():
    """
    Test 7:
    Non-existent match ID returns 404 across detail, approve, and reject endpoints.
    """
    assert client.get("/api/v1/matching/99999").status_code == 404
    assert client.post("/api/v1/matching/99999/approve", json={"common_material_code": "NMC-01"}).status_code == 404
    assert client.post("/api/v1/matching/99999/reject", json={"reason": "Test"}).status_code == 404


def test_matching_stats_endpoint(sample_review_materials):
    """
    Test 8:
    GET /api/v1/matching/stats returns comprehensive pipeline counts and confidence metrics.
    """
    client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )

    res = client.get("/api/v1/matching/stats")
    assert res.status_code == 200
    data = res.json()

    assert "total_recommendations" in data
    assert "pending_count" in data
    assert "approved_count" in data
    assert "rejected_count" in data
    assert "high_confidence_count" in data
    assert "review_required_count" in data
    assert "avg_confidence" in data
    assert data["total_recommendations"] >= 1
    assert data["pending_count"] == data["total_recommendations"]
