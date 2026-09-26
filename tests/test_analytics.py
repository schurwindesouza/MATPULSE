import pytest
from tests.conftest import client


def test_analytics_overview_empty_db():
    """Verify analytics endpoints behave gracefully when database is empty."""
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()

    assert data["summary"]["total_materials"] == 0
    assert data["summary"]["distinct_cpses"] == 0
    assert data["summary"]["harmonization_rate"] == 0.0
    assert data["cpse_distribution"] == []
    assert data["category_distribution"] == []
    assert data["confidence_distribution"]["total_matches"] == 0
    assert data["confidence_distribution"]["avg_confidence"] == 0.0
    assert data["review"]["total_reviewed"] == 0
    assert data["review"]["rejection_reasons"] == []
    assert data["common_materials"] == []
    assert data["data_quality"]["total_evaluated"] == 0
    assert data["data_quality"]["completeness_score"] == 0.0
    assert data["readiness"]["ready_count"] == 0


def test_analytics_overview_populated_and_filters():
    """Seed sample materials and matches, then test overview calculations and filtering."""
    # Seed 3 materials
    m1 = {
        "cpse": "BHEL",
        "material_code": "BHEL-001",
        "description": "Seamless Carbon Steel Pipe 50 NB Sch 40",
        "technical_specification": "ASTM A106 Grade B",
        "uom": "MTR",
        "category": "Pipes & Tubes",
        "common_material_code": "NMC-PIP-50",
        "matching_status": "MATCHED",
    }
    m2 = {
        "cpse": "NTPC",
        "material_code": "NTPC-001",
        "description": "Carbon Steel Pipe 2 inch NB Schedule 40",
        "technical_specification": "ASTM A106 Gr B",
        "uom": "MTR",
        "category": "Pipes & Tubes",
        "common_material_code": "NMC-PIP-50",
        "matching_status": "MATCHED",
    }
    m3 = {
        "cpse": "SAIL",
        "material_code": "SAIL-001",
        "description": "Gate Valve 100 NB Class 150",
        "technical_specification": "ASTM A216 WCB",
        "uom": "EA",
        "category": "Valves",
        "common_material_code": None,
        "matching_status": "UNMATCHED",
    }
    m4 = {
        "cpse": "BHEL",
        "material_code": "BHEL-002",
        "description": "Incomplete Record Without Specs",
        "technical_specification": None,
        "uom": None,
        "category": None,
        "matching_status": "SUGGESTED",
    }

    client.post("/api/v1/materials/", json=m1)
    client.post("/api/v1/materials/", json=m2)
    client.post("/api/v1/materials/", json=m3)
    client.post("/api/v1/materials/", json=m4)

    # 1. Unfiltered overview
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()

    assert data["summary"]["total_materials"] == 4
    assert data["summary"]["distinct_cpses"] == 3
    assert data["summary"]["matched_materials"] == 2
    assert data["summary"]["unmatched_materials"] == 1
    assert data["summary"]["suggested_materials"] == 1
    assert data["summary"]["harmonization_rate"] == 50.0  # 2/4 = 50%
    assert data["summary"]["total_common_codes"] == 1
    assert data["summary"]["total_mapped_materials"] == 2

    # Check CPSE distribution
    cpse_map = {item["cpse"]: item["count"] for item in data["cpse_distribution"]}
    assert cpse_map["BHEL"] == 2
    assert cpse_map["NTPC"] == 1
    assert cpse_map["SAIL"] == 1

    # Check Harmonization status distribution
    status_map = {item["status"]: item["count"] for item in data["harmonization_status"]}
    assert status_map["MATCHED"] == 2
    assert status_map["UNMATCHED"] == 1
    assert status_map["SUGGESTED"] == 1

    # Check Common materials
    assert len(data["common_materials"]) == 1
    common_item = data["common_materials"][0]
    assert common_item["common_material_code"] == "NMC-PIP-50"
    assert common_item["cpse_count"] == 2
    assert common_item["original_codes_count"] == 2
    assert "BHEL" in common_item["cpses"]
    assert "NTPC" in common_item["cpses"]

    # Check Readiness
    assert data["readiness"]["ready_count"] == 2
    assert data["readiness"]["needs_review_count"] == 1
    assert data["readiness"]["unmatched_blocked_count"] == 1

    # Check Data Quality
    assert data["data_quality"]["total_evaluated"] == 4
    assert data["data_quality"]["missing_uom"] == 1
    assert data["data_quality"]["missing_category"] == 1
    assert data["data_quality"]["missing_tech_specs"] == 1
    assert data["data_quality"]["completeness_score"] == 75.0  # 3 of 4 fully populated = 75%

    # 2. Filter by CPSE=BHEL
    res_bhel = client.get("/api/v1/analytics/overview?cpse=BHEL")
    assert res_bhel.status_code == 200
    bhel_data = res_bhel.json()
    assert bhel_data["summary"]["total_materials"] == 2
    assert bhel_data["summary"]["distinct_cpses"] == 1
    assert bhel_data["summary"]["matched_materials"] == 1
    assert bhel_data["summary"]["suggested_materials"] == 1
    assert bhel_data["summary"]["harmonization_rate"] == 50.0

    # 3. Filter by Category=Valves
    res_valves = client.get("/api/v1/analytics/overview?category=Valves")
    assert res_valves.status_code == 200
    valves_data = res_valves.json()
    assert valves_data["summary"]["total_materials"] == 1
    assert valves_data["summary"]["unmatched_materials"] == 1
    assert valves_data["common_materials"] == []


def test_individual_analytics_endpoints():
    """Verify individual granular endpoints operate consistently."""
    client.post(
        "/api/v1/materials/",
        json={
            "cpse": "IOCL",
            "material_code": "IOCL-01",
            "description": "Test Item",
            "category": "TestCat",
            "uom": "EA",
            "matching_status": "MATCHED",
        },
    )

    # Summary
    res = client.get("/api/v1/analytics/summary")
    assert res.status_code == 200
    assert res.json()["total_materials"] == 1

    # CPSE Distribution
    res_cpse = client.get("/api/v1/analytics/cpse-distribution")
    assert res_cpse.status_code == 200
    assert len(res_cpse.json()) == 1
    assert res_cpse.json()[0]["cpse"] == "IOCL"

    # Status Distribution
    res_status = client.get("/api/v1/analytics/harmonization-status")
    assert res_status.status_code == 200
    matched_entry = next(i for i in res_status.json() if i["status"] == "MATCHED")
    assert matched_entry["count"] == 1

    # Category Distribution
    res_cat = client.get("/api/v1/analytics/category-distribution")
    assert res_cat.status_code == 200
    assert res_cat.json()[0]["category"] == "TestCat"

    # Readiness
    res_ready = client.get("/api/v1/analytics/readiness")
    assert res_ready.status_code == 200
    assert res_ready.json()["ready_count"] == 1

    # Data Quality
    res_qual = client.get("/api/v1/analytics/data-quality")
    assert res_qual.status_code == 200
    assert res_qual.json()["total_evaluated"] == 1


def test_rejection_analytics_with_reasons():
    """Test review analytics including approved/rejected counts and actual rejection reasons."""
    # Create two materials and generate match
    m1 = client.post(
        "/api/v1/materials/",
        json={
            "cpse": "BHEL",
            "material_code": "REV-01",
            "description": "Gate Valve 50 NB Class 150",
            "category": "Valves",
            "uom": "EA",
        },
    ).json()

    m2 = client.post(
        "/api/v1/materials/",
        json={
            "cpse": "NTPC",
            "material_code": "REV-02",
            "description": "Gate Valve 50 NB Class 300",
            "category": "Valves",
            "uom": "EA",
        },
    ).json()

    # Generate recommendation
    client.post("/api/v1/matching/generate", json={"top_k": 5, "min_confidence": 50.0})

    # Fetch review queue
    queue = client.get("/api/v1/matching/review-queue").json()
    assert len(queue) >= 1
    match_id = queue[0]["id"]

    # Reject recommendation with explicit reason
    client.post(
        f"/api/v1/matching/{match_id}/reject",
        json={"reason": "Pressure rating mismatch (Class 150 vs Class 300)"},
    )

    # Check analytics review endpoint
    rev_res = client.get("/api/v1/analytics/review")
    assert rev_res.status_code == 200
    rev_data = rev_res.json()

    assert rev_data["rejected_count"] == 1
    assert rev_data["approved_count"] == 0
    assert rev_data["rejection_rate"] == 100.0
    assert len(rev_data["rejection_reasons"]) == 1
    assert rev_data["rejection_reasons"][0]["reason"] == "Pressure rating mismatch (Class 150 vs Class 300)"
    assert rev_data["rejection_reasons"][0]["count"] == 1
