import pytest
from app.services.candidate_matcher import generate_candidate_pairs, find_material_matches
from tests.conftest import client


class MockMaterial:
    def __init__(
        self,
        id: int,
        cpse: str,
        material_code: str,
        description: str,
        category: str = "Fasteners",
        uom: str = "EA",
        technical_specification: str = None,
    ):
        self.id = id
        self.cpse = cpse
        self.material_code = material_code
        self.description = description
        self.category = category
        self.uom = uom
        self.technical_specification = technical_specification


def test_cross_cpse_and_self_exclusion():
    """
    Test 1, 2 & 3:
    1. Cross-CPSE candidate pairs are produced.
    2. Same CPSE records are NOT matched against each other.
    3. A material is never matched with itself.
    """
    materials = [
        MockMaterial(1, "BHEL", "B-01", "SS HEX BOLT M10 X 50"),
        MockMaterial(2, "BHEL", "B-02", "CS PIPE 50 NB"),
        MockMaterial(3, "NTPC", "N-01", "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM"),
        MockMaterial(4, "NTPC", "N-02", "GATE VALVE 100 NB"),
    ]

    pairs = generate_candidate_pairs(materials)

    # Verify no pair has the same material (id_a != id_b)
    for m_a, m_b in pairs:
        assert m_a.id != m_b.id, f"Self-pairing detected: {m_a.id} == {m_b.id}"

    # Verify no pair has the same CPSE (cpse_a != cpse_b)
    for m_a, m_b in pairs:
        assert (
            m_a.cpse.lower() != m_b.cpse.lower()
        ), f"Same CPSE pairing detected: {m_a.cpse} == {m_b.cpse}"

    # Verify expected cross-CPSE combinations exist
    pair_ids = {(min(m_a.id, m_b.id), max(m_a.id, m_b.id)) for m_a, m_b in pairs}
    assert (1, 2) not in pair_ids  # BHEL & BHEL
    assert (3, 4) not in pair_ids  # NTPC & NTPC


def test_no_duplicate_reversed_pairs():
    """
    Test 4:
    Reversed duplicate pairs (e.g. A-B and B-A) are not evaluated twice.
    """
    materials = [
        MockMaterial(1, "BHEL", "B-01", "Item 1"),
        MockMaterial(2, "NTPC", "N-01", "Item 2"),
        MockMaterial(3, "ONGC", "O-01", "Item 3"),
    ]

    pairs = generate_candidate_pairs(materials)
    seen = set()
    for m_a, m_b in pairs:
        key = (min(m_a.id, m_b.id), max(m_a.id, m_b.id))
        assert key not in seen, f"Duplicate pair detected: {key}"
        seen.add(key)


def test_ranking_and_sorting_descending():
    """
    Test 5:
    Results for a material must be sorted strictly by final_confidence descending.
    """
    materials = [
        MockMaterial(1, "BHEL", "B-01", "SS HEX BOLT M10 X 50", category="Fasteners"),
        # Strong match
        MockMaterial(2, "NTPC", "N-01", "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM", category="Fasteners"),
        # Moderate / different dimension
        MockMaterial(3, "ONGC", "O-01", "SS HEX BOLT M16 X 75", category="Fasteners"),
        # Disparate material
        MockMaterial(4, "SAIL", "S-01", "MILD STEEL HEX BOLT M10 X 50", category="Fasteners"),
    ]

    batch_res = find_material_matches(materials, top_k=5, min_confidence=0.0)
    bhel_item = next(r for r in batch_res["results"] if r["material_id"] == 1)

    confidences = [m["final_confidence"] for m in bhel_item["matches"]]
    # Must be sorted in descending order
    assert confidences == sorted(confidences, reverse=True)
    # The first match must be the NTPC bolt (near 100%)
    assert bhel_item["matches"][0]["cpse"] == "NTPC"
    assert bhel_item["matches"][0]["final_confidence"] >= 90.0


def test_top_k_parameter():
    """
    Test 6:
    top_k parameter correctly limits the number of matches returned.
    """
    materials = [
        MockMaterial(1, "BHEL", "B-01", "CS PIPE 50 NB", category="Pipes"),
        MockMaterial(2, "NTPC", "N-01", "CS PIPE 50 NB", category="Pipes"),
        MockMaterial(3, "ONGC", "O-01", "CS PIPE 50 NB", category="Pipes"),
        MockMaterial(4, "SAIL", "S-01", "CS PIPE 50 NB", category="Pipes"),
        MockMaterial(5, "IOCL", "I-01", "CS PIPE 50 NB", category="Pipes"),
    ]

    # top_k = 2
    res_k2 = find_material_matches(materials, top_k=2)
    bhel_item = next(r for r in res_k2["results"] if r["material_id"] == 1)
    assert len(bhel_item["matches"]) <= 2

    # top_k = 3
    res_k3 = find_material_matches(materials, top_k=3)
    bhel_item_3 = next(r for r in res_k3["results"] if r["material_id"] == 1)
    assert len(bhel_item_3["matches"]) <= 3


def test_min_confidence_filter():
    """
    Test 7:
    min_confidence filters out matches below the threshold.
    """
    materials = [
        MockMaterial(1, "BHEL", "B-01", "SS HEX BOLT M10 X 50", category="Fasteners"),
        MockMaterial(2, "NTPC", "N-01", "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM", category="Fasteners"),
        MockMaterial(3, "SAIL", "S-01", "MILD STEEL HEX BOLT M10 X 50", category="Fasteners"),
    ]

    # Require high confidence only (>= 90.0)
    res_high = find_material_matches(materials, top_k=5, min_confidence=90.0)
    bhel_item = next(r for r in res_high["results"] if r["material_id"] == 1)

    # Only NTPC should qualify (SAIL has grade mismatch and is capped at 65.0)
    for match in bhel_item["matches"]:
        assert match["final_confidence"] >= 90.0
    matched_cpses = [m["cpse"] for m in bhel_item["matches"]]
    assert "NTPC" in matched_cpses
    assert "SAIL" not in matched_cpses


def test_api_batch_matching_endpoint():
    """
    Test 8:
    End-to-end API test for POST /api/v1/matching/batch
    """
    # Ingest 3 distinct CPSE materials into test database
    m_data = [
        {
            "cpse": "BHEL",
            "material_code": "BATCH-BHEL-01",
            "description": "SS HEX BOLT M10 X 50",
            "category": "Fasteners",
            "uom": "EA",
        },
        {
            "cpse": "NTPC",
            "material_code": "BATCH-NTPC-01",
            "description": "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM",
            "category": "Fasteners",
            "uom": "PCS",
        },
        {
            "cpse": "SAIL",
            "material_code": "BATCH-SAIL-01",
            "description": "MILD STEEL HEX BOLT M10 X 50",
            "category": "Fasteners",
            "uom": "EA",
        },
    ]
    for item in m_data:
        res = client.post("/api/v1/materials/", json=item)
        assert res.status_code == 201

    # Call batch endpoint
    api_res = client.post(
        "/api/v1/matching/batch",
        json={"top_k": 3, "min_confidence": 60.0},
    )
    assert api_res.status_code == 200
    data = api_res.json()

    assert data["total_materials"] >= 3
    assert data["pairs_evaluated"] > 0
    assert len(data["results"]) >= 3

    # Find BHEL in results
    bhel_res = next(r for r in data["results"] if r["material_code"] == "BATCH-BHEL-01")
    assert len(bhel_res["matches"]) > 0
    # First match should be NTPC (high confidence)
    assert bhel_res["matches"][0]["material_code"] == "BATCH-NTPC-01"
    assert bhel_res["matches"][0]["classification"] == "HIGH_CONFIDENCE_MATCH"
    assert bhel_res["matches"][0]["final_confidence"] >= 90.0
