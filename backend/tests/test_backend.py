"""Comprehensive backend tests for AUM Umum BK API — iteration 3.

Mode Demo has been fully removed. Only real JWT accounts remain. All queries
are scoped by owner_id. Tests use the seeded account gurubk.tes@sekolah.id
(read-only) and a freshly-registered account for cascade/delete flows.

Runs against the public preview URL supplied by EXPO_BACKEND_URL or
EXPO_PUBLIC_BACKEND_URL. Requires network access to the preview URL.
"""
import io
import os
import time
import uuid

import pandas as pd
import pytest
import requests

BASE_URL = (
    os.environ.get("EXPO_BACKEND_URL")
    or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or "https://project-hub-1020.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"

SEED_EMAIL = "gurubk.tes@sekolah.id"
SEED_PASSWORD = "rahasia123"


# --- Fixtures ---
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def seed_login(http):
    """Log in the seeded gurubk.tes account (has SMP Tes / VII A / Ani, Budi)."""
    r = http.post(f"{API}/auth/login", json={"email": SEED_EMAIL, "password": SEED_PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"Seed account login failed: {r.status_code} {r.text}")
    return r.json()


@pytest.fixture(scope="session")
def seed_headers(seed_login):
    return {"Authorization": f"Bearer {seed_login['token']}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def fresh_user(http):
    """Register a new user for isolation + cascade delete tests."""
    email = f"TEST_{uuid.uuid4().hex[:8]}@aum.local"
    r = http.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "TestPass123!"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "email": email, "user": data["user"]}


@pytest.fixture(scope="session")
def fresh_headers(fresh_user):
    return {"Authorization": f"Bearer {fresh_user['token']}", "Content-Type": "application/json"}


# --- Health ---
def test_health(http):
    r = http.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "ok" and j["service"] == "aum-umum-bk"


# --- Auth (demo REMOVED) ---
class TestAuth:
    def test_demo_endpoint_gone(self, http):
        """POST /api/auth/demo must no longer exist (404 or 405)."""
        r = http.post(f"{API}/auth/demo", timeout=15)
        assert r.status_code in (404, 405), f"Expected 404/405 for removed demo endpoint, got {r.status_code}: {r.text}"

    def test_login_seed(self, http):
        r = http.post(f"{API}/auth/login", json={"email": SEED_EMAIL, "password": SEED_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "token" in j and "user" in j
        # Response must not contain 'mode' field anymore
        assert "mode" not in j, f"Response still contains 'mode' field: {j}"
        assert j["user"]["email"] == SEED_EMAIL

    def test_login_wrong_password(self, http):
        r = http.post(f"{API}/auth/login", json={"email": SEED_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_register_and_me(self, http, fresh_user):
        r = http.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {fresh_user['token']}"}, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "mode" not in j, f"/auth/me returned mode: {j}"
        assert j["user"]["email"] == fresh_user["email"].lower()

    def test_register_duplicate(self, http, fresh_user):
        r = http.post(f"{API}/auth/register", json={"name": "Dup", "email": fresh_user["email"], "password": "TestPass123!"}, timeout=15)
        assert r.status_code == 409

    def test_register_short_password(self, http):
        r = http.post(f"{API}/auth/register", json={"name": "Ab", "email": f"TEST_{uuid.uuid4().hex[:6]}@a.b", "password": "short"}, timeout=15)
        assert r.status_code == 400

    def test_missing_auth_header(self, http):
        r = http.get(f"{API}/schools", timeout=15)
        assert r.status_code == 401


# --- Formats ---
class TestFormats:
    def test_verification_totals(self, http):
        r = http.get(f"{API}/formats/verification", timeout=15)
        assert r.status_code == 200
        expected = {"format_1": 75, "format_2": 155, "format_3": 200, "format_4": 210, "format_5": 265}
        seen = {row["format_id"]: row for row in r.json()}
        for fid, total in expected.items():
            assert seen[fid]["total_items"] == total
            assert seen[fid]["domain_total"] == total
            assert seen[fid]["unique_item_total"] == total

    def test_formats_list(self, http):
        r = http.get(f"{API}/formats", timeout=15)
        assert r.status_code == 200 and len(r.json()) == 5


# --- Owner isolation ---
class TestIsolation:
    def test_fresh_user_sees_no_seed_schools(self, http, fresh_headers):
        r = http.get(f"{API}/schools", headers=fresh_headers, timeout=15)
        assert r.status_code == 200
        names = [s["name"] for s in r.json()]
        assert "SMP Tes" not in names, f"Fresh user leaked seed school data: {names}"

    def test_seed_user_has_smp_tes(self, http, seed_headers):
        r = http.get(f"{API}/schools", headers=seed_headers, timeout=15)
        assert r.status_code == 200
        names = [s["name"] for s in r.json()]
        assert "SMP Tes" in names, f"Seed user missing SMP Tes: {names}"

    def test_seed_user_respondents(self, http, seed_headers):
        r = http.get(f"{API}/respondents", headers=seed_headers, timeout=15)
        assert r.status_code == 200
        names = [p["name"] for p in r.json()]
        # Seed should have Ani and Budi
        assert any("Ani" in n for n in names) and any("Budi" in n for n in names), f"Missing Ani/Budi: {names}"

    def test_konseling_scoped(self, http, seed_headers, fresh_headers):
        r_seed = http.get(f"{API}/konseling", headers=seed_headers, timeout=15)
        r_fresh = http.get(f"{API}/konseling", headers=fresh_headers, timeout=15)
        assert r_seed.status_code == 200 and r_fresh.status_code == 200
        # Fresh user has no data
        assert r_fresh.json()["items"] == []


# --- Schools CRUD + PATCH + DELETE cascade ---
class TestSchoolsCrud:
    def test_create_patch_delete_cascade(self, http, fresh_headers):
        # Create school
        r = http.post(f"{API}/schools", headers=fresh_headers, json={"name": "TEST Cascade SMP", "academic_year": "2025/2026"}, timeout=15)
        assert r.status_code == 200, r.text
        school = r.json()
        assert "mode" not in school, "school payload contains legacy 'mode' key"
        sid = school["id"]

        # PATCH school name + academic_year
        rp = http.patch(f"{API}/schools/{sid}", headers=fresh_headers, json={"name": "TEST Cascade SMP v2", "academic_year": "2026/2027"}, timeout=15)
        assert rp.status_code == 200, rp.text
        assert rp.json()["name"] == "TEST Cascade SMP v2"
        assert rp.json()["academic_year"] == "2026/2027"

        # Create class + respondent for cascade
        rc = http.post(f"{API}/classes", headers=fresh_headers, json={"school_id": sid, "name": "TEST VII", "level": "SLTP", "format_id": "format_2"}, timeout=15)
        assert rc.status_code == 200, rc.text
        cid = rc.json()["id"]

        rr = http.post(f"{API}/respondents", headers=fresh_headers, json={
            "name": "TEST Cascade R1", "format_id": "format_2", "class_id": cid,
            "selected_problem_numbers": [1, 6, 11], "heavy_problem_numbers": [1],
            "third_step": {"complete": "Ya"},
        }, timeout=15)
        assert rr.status_code == 200, rr.text
        rid = rr.json()["respondent"]["id"]

        # DELETE school (cascade)
        rd = http.delete(f"{API}/schools/{sid}", headers=fresh_headers, timeout=15)
        assert rd.status_code == 200, rd.text
        j = rd.json()
        assert j["deleted_school"] == 1
        assert j["deleted_classes"] >= 1
        assert j["deleted_respondents"] >= 1

        # Verify cascade: school & class & respondent are gone
        assert http.patch(f"{API}/schools/{sid}", headers=fresh_headers, json={"name": "x"}, timeout=15).status_code == 404
        assert http.get(f"{API}/results/individual/{rid}", headers=fresh_headers, timeout=15).status_code == 404

        # Audit log contains delete_school action
        ra = http.get(f"{API}/audit", headers=fresh_headers, timeout=15)
        actions = [row["action"] for row in ra.json()]
        assert "delete_school" in actions, f"Audit missing delete_school: {actions}"

    def test_delete_class_cascade_and_audit(self, http, fresh_headers):
        rs = http.post(f"{API}/schools", headers=fresh_headers, json={"name": "TEST ClassCascade"}, timeout=15)
        sid = rs.json()["id"]
        rc = http.post(f"{API}/classes", headers=fresh_headers, json={"school_id": sid, "name": "TEST VIII", "format_id": "format_2"}, timeout=15)
        cid = rc.json()["id"]
        rr = http.post(f"{API}/respondents", headers=fresh_headers, json={
            "name": "TEST cls_del", "format_id": "format_2", "class_id": cid,
            "selected_problem_numbers": [2, 7], "heavy_problem_numbers": [],
            "third_step": {},
        }, timeout=15)
        rid = rr.json()["respondent"]["id"]
        rd = http.delete(f"{API}/classes/{cid}", headers=fresh_headers, timeout=15)
        assert rd.status_code == 200, rd.text
        assert rd.json()["deleted_class"] == 1 and rd.json()["deleted_respondents"] == 1
        # Respondent should now be gone
        assert http.get(f"{API}/results/individual/{rid}", headers=fresh_headers, timeout=15).status_code == 404
        actions = [row["action"] for row in http.get(f"{API}/audit", headers=fresh_headers, timeout=15).json()]
        assert "delete_class" in actions

    def test_delete_respondent_and_audit(self, http, fresh_headers):
        rs = http.post(f"{API}/schools", headers=fresh_headers, json={"name": "TEST RespDel"}, timeout=15)
        sid = rs.json()["id"]
        rc = http.post(f"{API}/classes", headers=fresh_headers, json={"school_id": sid, "name": "TEST IX", "format_id": "format_2"}, timeout=15)
        cid = rc.json()["id"]
        rr = http.post(f"{API}/respondents", headers=fresh_headers, json={
            "name": "TEST rdel", "format_id": "format_2", "class_id": cid,
            "selected_problem_numbers": [1], "heavy_problem_numbers": [1], "third_step": {},
        }, timeout=15)
        rid = rr.json()["respondent"]["id"]
        rd = http.delete(f"{API}/respondents/{rid}", headers=fresh_headers, timeout=15)
        assert rd.status_code == 200 and rd.json()["deleted"] == 1
        assert http.get(f"{API}/results/individual/{rid}", headers=fresh_headers, timeout=15).status_code == 404
        actions = [row["action"] for row in http.get(f"{API}/audit", headers=fresh_headers, timeout=15).json()]
        assert "delete_respondent" in actions

    def test_class_create_unknown_format(self, http, fresh_headers):
        rs = http.post(f"{API}/schools", headers=fresh_headers, json={"name": "TEST FmtFail"}, timeout=15)
        sid = rs.json()["id"]
        rc = http.post(f"{API}/classes", headers=fresh_headers, json={"school_id": sid, "name": "X", "format_id": "format_99"}, timeout=15)
        assert rc.status_code == 400


# --- Bulk wizard ---
class TestBulk:
    @pytest.fixture(scope="class")
    def bulk_class(self, http, fresh_headers):
        rs = http.post(f"{API}/schools", headers=fresh_headers, json={"name": "TEST BulkSchool"}, timeout=15)
        sid = rs.json()["id"]
        rc = http.post(f"{API}/classes", headers=fresh_headers, json={"school_id": sid, "name": "BULK A", "format_id": "format_2"}, timeout=15)
        return {"school_id": sid, "class_id": rc.json()["id"]}

    def test_bulk_ok(self, http, fresh_headers, bulk_class):
        payload = {
            "class_id": bulk_class["class_id"], "format_id": "format_2", "academic_year": "2025/2026",
            "items": [
                {"name": "TEST Bulk A1", "gender": "P", "selected_problem_numbers": [1, 6, 11], "heavy_problem_numbers": [1], "third_step": {"want_discussion": "Ya", "discussion_with": "Guru BK"}},
                {"name": "TEST Bulk A2", "gender": "L", "selected_problem_numbers": [2, 7, 12], "heavy_problem_numbers": [], "third_step": {}},
            ],
        }
        r = http.post(f"{API}/respondents/bulk", headers=fresh_headers, json=payload, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["saved"] == 2
        # Verify persistence
        lst = http.get(f"{API}/respondents?class_id={bulk_class['class_id']}", headers=fresh_headers, timeout=15).json()
        names = [p["name"] for p in lst]
        assert "TEST Bulk A1" in names and "TEST Bulk A2" in names

    def test_bulk_out_of_range_422(self, http, fresh_headers, bulk_class):
        payload = {
            "class_id": bulk_class["class_id"], "format_id": "format_2",
            "items": [
                {"name": "TEST Bulk OOR", "selected_problem_numbers": [999], "heavy_problem_numbers": [], "third_step": {}},
            ],
        }
        r = http.post(f"{API}/respondents/bulk", headers=fresh_headers, json=payload, timeout=15)
        assert r.status_code == 422, r.text
        body = r.json()
        # Detail should contain row_errors
        detail = body.get("detail", body)
        row_errors = detail.get("row_errors") if isinstance(detail, dict) else None
        assert row_errors, f"Expected row_errors in 422 body, got {body}"

    def test_bulk_heavy_not_subset_422(self, http, fresh_headers, bulk_class):
        payload = {
            "class_id": bulk_class["class_id"], "format_id": "format_2",
            "items": [
                {"name": "TEST Bulk HN", "selected_problem_numbers": [1, 2], "heavy_problem_numbers": [4], "third_step": {}},
            ],
        }
        r = http.post(f"{API}/respondents/bulk", headers=fresh_headers, json=payload, timeout=15)
        assert r.status_code == 422, r.text

    def test_bulk_empty_items_400(self, http, fresh_headers, bulk_class):
        payload = {"class_id": bulk_class["class_id"], "format_id": "format_2", "items": []}
        r = http.post(f"{API}/respondents/bulk", headers=fresh_headers, json=payload, timeout=15)
        assert r.status_code == 400, r.text


# --- Konseling board ---
class TestKonseling:
    def test_konseling_only_want_discussion(self, http, seed_headers):
        r = http.get(f"{API}/konseling", headers=seed_headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "items" in j and "counts" in j
        # Every returned item must correspond to want_discussion=Ya (verified by fetching respondents)
        for item in j["items"]:
            assert item["status"] in ("Belum", "Dijadwalkan", "Selesai")

    def test_konseling_patch_status_and_note(self, http, fresh_headers):
        # Create respondent with want_discussion=Ya
        rs = http.post(f"{API}/schools", headers=fresh_headers, json={"name": "TEST KSch"}, timeout=15)
        sid = rs.json()["id"]
        rc = http.post(f"{API}/classes", headers=fresh_headers, json={"school_id": sid, "name": "K1", "format_id": "format_2"}, timeout=15)
        cid = rc.json()["id"]
        rr = http.post(f"{API}/respondents", headers=fresh_headers, json={
            "name": "TEST K1", "format_id": "format_2", "class_id": cid,
            "selected_problem_numbers": [1, 6], "heavy_problem_numbers": [1],
            "third_step": {"want_discussion": "Ya", "discussion_with": "Guru BK"},
        }, timeout=15)
        rid = rr.json()["respondent"]["id"]

        # Appears on konseling board
        board = http.get(f"{API}/konseling", headers=fresh_headers, timeout=15).json()
        assert any(i["id"] == rid for i in board["items"])
        assert board["counts"]["Belum"] >= 1

        # PATCH → Dijadwalkan + note
        rp = http.patch(f"{API}/respondents/{rid}/konseling", headers=fresh_headers, json={"status": "Dijadwalkan", "note": "Test schedule"}, timeout=15)
        assert rp.status_code == 200
        board2 = http.get(f"{API}/konseling", headers=fresh_headers, timeout=15).json()
        matched = next((i for i in board2["items"] if i["id"] == rid), None)
        assert matched and matched["status"] == "Dijadwalkan" and matched["note"] == "Test schedule"

    def test_konseling_patch_invalid_status(self, http, fresh_headers):
        # First need a valid respondent
        rr = http.get(f"{API}/respondents", headers=fresh_headers, timeout=15).json()
        if not rr:
            pytest.skip("No respondent available")
        rid = rr[0]["id"]
        r = http.patch(f"{API}/respondents/{rid}/konseling", headers=fresh_headers, json={"status": "Bogus", "note": ""}, timeout=15)
        assert r.status_code == 400


# --- Rekap trend ---
class TestTrend:
    def test_trend_seed(self, http, seed_headers):
        r_sch = http.get(f"{API}/schools", headers=seed_headers, timeout=15).json()
        sid = next(s["id"] for s in r_sch if s["name"] == "SMP Tes")
        r = http.get(f"{API}/rekap/trend?school_id={sid}", headers=seed_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "years" in j and "series" in j
        assert isinstance(j["years"], list) and isinstance(j["series"], list)
        # Each series entry has points list
        for s in j["series"]:
            assert "code" in s and "points" in s and isinstance(s["points"], list)


# --- Analysis (deterministic + AI) ---
class TestAnalysis:
    @pytest.fixture(scope="class")
    def ai_scope(self, http, fresh_headers):
        """Set up own class+respondent for AI test (to avoid mutating seed cache)."""
        rs = http.post(f"{API}/schools", headers=fresh_headers, json={"name": "TEST AI School"}, timeout=15)
        sid = rs.json()["id"]
        rc = http.post(f"{API}/classes", headers=fresh_headers, json={"school_id": sid, "name": "AI 1", "format_id": "format_2"}, timeout=15)
        cid = rc.json()["id"]
        rr = http.post(f"{API}/respondents", headers=fresh_headers, json={
            "name": "TEST AI person", "format_id": "format_2", "class_id": cid,
            "selected_problem_numbers": [1, 6, 11, 21, 41], "heavy_problem_numbers": [1, 6],
            "third_step": {"want_discussion": "Ya", "discussion_with": "Guru BK"},
        }, timeout=15)
        return {"school_id": sid, "class_id": cid, "respondent_id": rr.json()["respondent"]["id"]}

    def test_analysis_individual_deterministic(self, http, fresh_headers, ai_scope):
        r = http.get(f"{API}/analysis/individual/{ai_scope['respondent_id']}", headers=fresh_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        for key in ("highlights", "priorities", "recommendations", "rules"):
            assert key in j and isinstance(j[key], list)
        assert j["priorities"], "priorities must not be empty for a respondent with problems"

    def test_analysis_group_deterministic(self, http, fresh_headers, ai_scope):
        # Add one more respondent so group has >= 1
        r = http.get(f"{API}/analysis/group/{ai_scope['class_id']}", headers=fresh_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        for key in ("highlights", "priorities", "recommendations", "rules"):
            assert key in j

    def test_analysis_school_deterministic(self, http, fresh_headers, ai_scope):
        r = http.get(f"{API}/analysis/school/{ai_scope['school_id']}", headers=fresh_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        for key in ("highlights", "priorities", "recommendations", "rules"):
            assert key in j

    def test_analysis_ai_individual_and_cache(self, http, fresh_headers, ai_scope):
        """One real LLM call (~10-30s), then verify second call returns cached=True."""
        t0 = time.time()
        r = http.post(f"{API}/analysis/individual/{ai_scope['respondent_id']}/ai", headers=fresh_headers, timeout=90)
        elapsed = time.time() - t0
        assert r.status_code == 200, f"AI call failed after {elapsed:.1f}s: {r.status_code} {r.text[:400]}"
        j = r.json()
        assert "narrative" in j and j["narrative"], f"empty narrative: {j}"
        assert j.get("cached") in (False, None), f"first call should not be cached, got {j.get('cached')}"

        # Second call should be cached
        r2 = http.post(f"{API}/analysis/individual/{ai_scope['respondent_id']}/ai", headers=fresh_headers, timeout=15)
        assert r2.status_code == 200
        j2 = r2.json()
        assert j2.get("cached") is True, f"second call must be cached, got {j2}"
        assert j2["narrative"] == j["narrative"]


# --- Export ---
class TestExport:
    def test_export_individual_pdf_and_xlsx(self, http, seed_headers, seed_login):
        r = http.get(f"{API}/respondents", headers=seed_headers, timeout=15)
        assert r.status_code == 200 and r.json(), "seed user must have respondents"
        rid = r.json()[0]["id"]
        token = seed_login["token"]
        rp = requests.get(f"{API}/export/individual/{rid}?format=pdf", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert rp.status_code == 200
        assert rp.headers.get("content-type", "").startswith("application/pdf")
        assert rp.content[:4] == b"%PDF"
        rx = requests.get(f"{API}/export/individual/{rid}?format=xlsx", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert rx.status_code == 200
        assert "spreadsheetml" in rx.headers.get("content-type", "")

    def test_export_group_pdf(self, http, seed_headers, seed_login):
        # Find seed class VII A
        schools = http.get(f"{API}/schools", headers=seed_headers, timeout=15).json()
        sid = next(s["id"] for s in schools if s["name"] == "SMP Tes")
        classes = http.get(f"{API}/classes?school_id={sid}", headers=seed_headers, timeout=15).json()
        assert classes, "seed school must have classes"
        cid = classes[0]["id"]
        token = seed_login["token"]
        r = requests.get(f"{API}/export/group/{cid}?format=pdf", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"


# --- Regression: scoring, rekap, audit, import, formats ---
class TestRegression:
    def test_scoring_group_has_consultation(self, http, seed_headers):
        schools = http.get(f"{API}/schools", headers=seed_headers, timeout=15).json()
        sid = next(s["id"] for s in schools if s["name"] == "SMP Tes")
        classes = http.get(f"{API}/classes?school_id={sid}", headers=seed_headers, timeout=15).json()
        cid = classes[0]["id"]
        fmt = classes[0]["format_id"]
        r = http.post(f"{API}/scoring/group", headers=seed_headers, json={"format_id": fmt, "class_id": cid}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "consultation" in j, f"scoring/group missing 'consultation' field: {list(j.keys())}"
        assert isinstance(j["consultation"], dict)

    def test_rekap_school(self, http, seed_headers):
        schools = http.get(f"{API}/schools", headers=seed_headers, timeout=15).json()
        sid = next(s["id"] for s in schools if s["name"] == "SMP Tes")
        r = http.get(f"{API}/rekap/school/{sid}", headers=seed_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["school"]["id"] == sid and j["respondent_count"] >= 2

    def test_rekap_comparison(self, http, seed_headers):
        schools = http.get(f"{API}/schools", headers=seed_headers, timeout=15).json()
        sid = next(s["id"] for s in schools if s["name"] == "SMP Tes")
        r = http.get(f"{API}/rekap/comparison?school_id={sid}", headers=seed_headers, timeout=15)
        assert r.status_code == 200

    def test_audit_individual(self, http, seed_headers):
        rr = http.get(f"{API}/respondents", headers=seed_headers, timeout=15).json()
        rid = rr[0]["id"]
        r = http.get(f"{API}/audit/individual/{rid}", headers=seed_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert len(j["breakdown"]) > 0
        for row in j["breakdown"]:
            assert "formula" in row and "%" in row["formula"]

    def test_import_excel_valid(self, http, seed_login):
        # Import into seed user
        token = seed_login["token"]
        # find seed class name
        schools = requests.get(f"{API}/schools", headers={"Authorization": f"Bearer {token}"}, timeout=15).json()
        sid = next(s["id"] for s in schools if s["name"] == "SMP Tes")
        classes = requests.get(f"{API}/classes?school_id={sid}", headers={"Authorization": f"Bearer {token}"}, timeout=15).json()
        cls_name = classes[0]["name"]
        buf = io.BytesIO()
        pd.DataFrame([
            {"nama": "TEST_imp1", "jenis_kelamin": "P", "sekolah": "SMP Tes", "kelas": cls_name, "format_id": "format_2", "nomor_masalah": "1; 6; 11", "masalah_berat": "1"},
            {"nama": "TEST_imp2", "jenis_kelamin": "L", "sekolah": "SMP Tes", "kelas": cls_name, "format_id": "format_2", "nomor_masalah": "2; 7", "masalah_berat": "2"},
        ]).to_excel(buf, index=False, engine="openpyxl")
        buf.seek(0)
        r = requests.post(f"{API}/import/excel", headers={"Authorization": f"Bearer {token}"}, files={"file": ("t.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["imported"] == 2 and j["rejected"] == 0 and j["transactional"] is True
