"""Comprehensive backend tests for AUM Umum BK API.

Runs against the public preview URL supplied by EXPO_PUBLIC_BACKEND_URL
(fall back to EXPO_BACKEND_URL for compatibility with system rules).
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


@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def demo_token(http):
    r = http.post(f"{API}/auth/demo", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def real_user(http):
    """Register a fresh real-mode user and return (token, email)."""
    email = f"TEST_{uuid.uuid4().hex[:8]}@aum.local"
    r = http.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "TestPass123!"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "email": email, "mode": data["mode"]}


@pytest.fixture(scope="session")
def real_headers(real_user):
    return {"Authorization": f"Bearer {real_user['token']}", "Content-Type": "application/json"}


# --- Health ---
def test_health(http):
    r = http.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "ok"
    assert j["service"] == "aum-umum-bk"


# --- Auth ---
class TestAuth:
    def test_demo_returns_token_and_mode(self, http):
        r = http.post(f"{API}/auth/demo", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["mode"] == "demo"
        assert j.get("token")
        assert j["user"]["email"] == "guru@aum.local"

    def test_seeded_login(self, http):
        r = http.post(f"{API}/auth/login", json={"email": "guru@aum.local", "password": "demo123"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["mode"] == "demo"

    def test_login_wrong_password(self, http):
        r = http.post(f"{API}/auth/login", json={"email": "guru@aum.local", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_register_and_me(self, http, real_user):
        # /auth/me works with the freshly minted token
        r = http.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {real_user['token']}"}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j["mode"] == "real"
        # Server normalizes email to lowercase on register
        assert j["user"]["email"] == real_user["email"].lower()

    def test_register_duplicate(self, http, real_user):
        r = http.post(f"{API}/auth/register", json={"name": "Dup", "email": real_user["email"], "password": "TestPass123!"}, timeout=15)
        assert r.status_code == 409

    def test_register_short_password(self, http):
        r = http.post(f"{API}/auth/register", json={"name": "Ab", "email": f"TEST_{uuid.uuid4().hex[:6]}@a.b", "password": "short"}, timeout=15)
        assert r.status_code == 400


# --- Format Verification ---
class TestFormats:
    def test_verification_totals(self, http):
        r = http.get(f"{API}/formats/verification", timeout=15)
        assert r.status_code == 200
        expected = {"format_1": 75, "format_2": 155, "format_3": 200, "format_4": 210, "format_5": 265}
        seen = {row["format_id"]: row for row in r.json()}
        assert set(seen.keys()) == set(expected.keys())
        for fid, total in expected.items():
            row = seen[fid]
            assert row["total_items"] == total, f"{fid} total_items mismatch"
            assert row["domain_total"] == total, f"{fid} domain_total != total_items"
            assert row["unique_item_total"] == total, f"{fid} unique_item_total mismatch"

    def test_formats_list(self, http):
        r = http.get(f"{API}/formats", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) == 5


# --- Schools & Classes ---
class TestSchools:
    def test_demo_schools_shared(self, http, demo_headers):
        r = http.get(f"{API}/schools", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        names = [s["name"] for s in r.json()]
        assert any("Harapan Bangsa" in n for n in names)

    def test_real_school_isolation(self, http, real_headers):
        # A fresh real user has no schools initially
        r = http.get(f"{API}/schools", headers=real_headers, timeout=15)
        assert r.status_code == 200
        assert r.json() == []

    def test_create_school_and_class(self, http, real_headers):
        r = http.post(f"{API}/schools", headers=real_headers, json={"name": "TEST SMP Uji", "academic_year": "2025/2026", "levels": ["SLTP"]}, timeout=15)
        assert r.status_code == 200, r.text
        school = r.json()
        assert school["mode"] == "real"
        assert school["name"] == "TEST SMP Uji"
        school_id = school["id"]

        # GET verifies persistence
        listing = http.get(f"{API}/schools", headers=real_headers, timeout=15).json()
        assert any(s["id"] == school_id for s in listing)

        # Class create
        rc = http.post(f"{API}/classes", headers=real_headers, json={"school_id": school_id, "name": "TEST VII A", "level": "SLTP", "format_id": "format_2"}, timeout=15)
        assert rc.status_code == 200, rc.text
        cls = rc.json()
        assert cls["school_id"] == school_id
        # GET classes
        classes_list = http.get(f"{API}/classes?school_id={school_id}", headers=real_headers, timeout=15).json()
        assert any(c["id"] == cls["id"] for c in classes_list)

    def test_create_class_unknown_format(self, http, real_headers):
        r = http.post(f"{API}/schools", headers=real_headers, json={"name": "TEST SMP X"}, timeout=15)
        sid = r.json()["id"]
        rc = http.post(f"{API}/classes", headers=real_headers, json={"school_id": sid, "name": "X", "format_id": "format_99"}, timeout=15)
        assert rc.status_code == 400

    def test_create_class_missing_school(self, http, real_headers):
        rc = http.post(f"{API}/classes", headers=real_headers, json={"school_id": "does_not_exist", "name": "X", "format_id": "format_2"}, timeout=15)
        assert rc.status_code == 404


# --- Scoring ---
class TestScoring:
    def test_scoring_individual(self, http, demo_headers):
        payload = {"format_id": "format_2", "name": "TEST_score", "selected_problem_numbers": [1, 7, 17, 42, 77, 107], "heavy_problem_numbers": [42]}
        r = http.post(f"{API}/scoring/individual", headers=demo_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["total_problems"] == 6
        assert j["total_heavy_problems"] == 1
        assert len(j["rows"]) == 10  # format_2 has 10 domains
        # Each row has expected shape
        for row in j["rows"]:
            assert set(["domain_code", "domain_name", "item_count", "count", "percentage", "heavy_count"]).issubset(row.keys())

    def test_scoring_out_of_range(self, http, demo_headers):
        payload = {"format_id": "format_2", "name": "x", "selected_problem_numbers": [999], "heavy_problem_numbers": []}
        r = http.post(f"{API}/scoring/individual", headers=demo_headers, json=payload, timeout=15)
        assert r.status_code == 400

    def test_scoring_heavy_not_subset(self, http, demo_headers):
        payload = {"format_id": "format_2", "name": "x", "selected_problem_numbers": [1, 2, 3], "heavy_problem_numbers": [4]}
        r = http.post(f"{API}/scoring/individual", headers=demo_headers, json=payload, timeout=15)
        assert r.status_code == 400

    @pytest.mark.xfail(reason="score_individual accesses FORMATS[format_id] before validate_selection -> unknown format leaks KeyError as HTTP 500 instead of 400. Backend bug.")
    def test_scoring_unknown_format(self, http, demo_headers):
        r = http.post(f"{API}/scoring/individual", headers=demo_headers, json={"format_id": "format_x", "name": "x", "selected_problem_numbers": [], "heavy_problem_numbers": []}, timeout=15)
        assert r.status_code == 400

    def test_scoring_group_by_class(self, http, demo_headers):
        # Analytics bug regression: must respond promptly with data
        start = time.time()
        r = http.post(f"{API}/scoring/group", headers=demo_headers, json={"format_id": "format_2", "class_id": "demo_class_vii_a"}, timeout=30)
        elapsed = time.time() - start
        assert r.status_code == 200, r.text
        assert elapsed < 15, f"scoring/group too slow ({elapsed}s)"
        j = r.json()
        assert j["respondent_count"] >= 2
        assert len(j["rows"]) == 10
        assert "audit" in j

    def test_scoring_group_empty(self, http, demo_headers):
        r = http.post(f"{API}/scoring/group", headers=demo_headers, json={"format_id": "format_2", "class_id": "nonexistent"}, timeout=15)
        assert r.status_code == 404


# --- Rekap ---
class TestRekap:
    def test_rekap_school_demo(self, http, demo_headers):
        r = http.get(f"{API}/rekap/school/demo_school", headers=demo_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["school"]["id"] == "demo_school"
        assert j["class_count"] >= 2
        assert j["respondent_count"] >= 4
        assert isinstance(j["domain_rows"], list) and len(j["domain_rows"]) > 0
        # class_summary contains our seeded classes
        class_ids = {c["class_id"] for c in j["class_summary"]}
        assert "demo_class_vii_a" in class_ids and "demo_class_vii_b" in class_ids

    def test_rekap_school_not_found(self, http, demo_headers):
        r = http.get(f"{API}/rekap/school/no_such_school", headers=demo_headers, timeout=15)
        assert r.status_code == 404

    def test_rekap_comparison(self, http, demo_headers):
        r = http.get(f"{API}/rekap/comparison?school_id=demo_school", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert len(j["classes"]) >= 2
        assert len(j["domains"]) > 0
        # Each domain row has one cell per class
        for row in j["domains"]:
            assert len(row["cells"]) == len(j["classes"])

    def test_rekap_comparison_empty_school(self, http, real_headers):
        # Create school with no classes for a real user
        r = http.post(f"{API}/schools", headers=real_headers, json={"name": "TEST SMP Kosong"}, timeout=15)
        sid = r.json()["id"]
        rc = http.get(f"{API}/rekap/comparison?school_id={sid}", headers=real_headers, timeout=15)
        assert rc.status_code == 200
        assert rc.json() == {"classes": [], "domains": []}


# --- Respondents / Wizard ---
class TestRespondents:
    def test_create_respondent_and_result(self, http, demo_headers):
        payload = {
            "mode": "demo", "name": "TEST_wizard",
            "format_id": "format_2", "class_id": "demo_class_vii_a",
            "selected_problem_numbers": [1, 7, 42], "heavy_problem_numbers": [7],
            "third_step": {"complete": "Ya"},
        }
        r = http.post(f"{API}/respondents", headers=demo_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["result"]["total_problems"] == 3
        assert j["result"]["total_heavy_problems"] == 1
        rid = j["respondent"]["id"]
        # Verify persistence
        rr = http.get(f"{API}/results/individual/{rid}", headers=demo_headers, timeout=15)
        assert rr.status_code == 200
        assert rr.json()["respondent"]["id"] == rid


# --- Import Excel ---
class TestImport:
    def _make_xlsx(self, rows):
        buf = io.BytesIO()
        pd.DataFrame(rows).to_excel(buf, index=False, engine="openpyxl")
        buf.seek(0)
        return buf

    def test_import_valid(self, http, demo_token):
        # Use plain integers as strings without leading zeros to avoid pandas
        # column-type coercion (mixed string/NaN promoting to float which then
        # stringifies as "1.0" and breaks parse_problem_numbers).
        buf = self._make_xlsx([
            {"nama": "TEST_imp1", "jenis_kelamin": "P", "sekolah": "SMP Harapan Bangsa", "kelas": "VII A", "format_id": "format_2", "nomor_masalah": "1; 6; 11", "masalah_berat": "1"},
            {"nama": "TEST_imp2", "jenis_kelamin": "L", "sekolah": "SMP Harapan Bangsa", "kelas": "VII A", "format_id": "format_2", "nomor_masalah": "2; 7", "masalah_berat": "2"},
        ])
        r = requests.post(f"{API}/import/excel", headers={"Authorization": f"Bearer {demo_token}"}, files={"file": ("t.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["imported"] == 2 and j["rejected"] == 0 and j["transactional"] is True

    def test_import_invalid_transactional(self, http, demo_token):
        # Second row invalid -> nothing should be inserted
        buf = self._make_xlsx([
            {"nama": "TEST_imp_ok", "format_id": "format_2", "nomor_masalah": "1; 2"},
            {"nama": "TEST_imp_bad", "format_id": "format_2", "nomor_masalah": "999"},
        ])
        r = requests.post(f"{API}/import/excel", headers={"Authorization": f"Bearer {demo_token}"}, files={"file": ("t.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}, timeout=30)
        assert r.status_code == 422, r.text

    @pytest.mark.xfail(reason="parse_problem_numbers stringifies pandas float ('1.0') producing spurious '0' -> heavy not subset of selected. Backend bug.")
    def test_import_mixed_leading_zero_bug(self, http, demo_token):
        buf = self._make_xlsx([
            {"nama": "TEST_lz1", "format_id": "format_2", "nomor_masalah": "001; 006; 011", "masalah_berat": "001"},
            {"nama": "TEST_lz2", "format_id": "format_2", "nomor_masalah": "002; 007", "masalah_berat": ""},
        ])
        r = requests.post(f"{API}/import/excel", headers={"Authorization": f"Bearer {demo_token}"}, files={"file": ("t.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}, timeout=30)
        assert r.status_code == 200, r.text


# --- Export ---
class TestExport:
    def test_export_individual_xlsx(self, http, demo_token):
        # find a demo respondent
        r = requests.get(f"{API}/respondents", headers={"Authorization": f"Bearer {demo_token}"}, timeout=15)
        rid = r.json()[0]["id"]
        rx = requests.get(f"{API}/export/individual/{rid}?format=xlsx", headers={"Authorization": f"Bearer {demo_token}"}, timeout=30)
        assert rx.status_code == 200
        assert "spreadsheetml" in rx.headers.get("content-type", "")
        assert len(rx.content) > 100

    def test_export_individual_pdf(self, http, demo_token):
        r = requests.get(f"{API}/respondents", headers={"Authorization": f"Bearer {demo_token}"}, timeout=15)
        rid = r.json()[0]["id"]
        rx = requests.get(f"{API}/export/individual/{rid}?format=pdf", headers={"Authorization": f"Bearer {demo_token}"}, timeout=30)
        assert rx.status_code == 200
        assert rx.headers.get("content-type", "").startswith("application/pdf")
        assert rx.content[:4] == b"%PDF"

    def test_export_group_pdf(self, http, demo_token):
        rx = requests.get(f"{API}/export/group/demo_class_vii_a?format=pdf", headers={"Authorization": f"Bearer {demo_token}"}, timeout=30)
        assert rx.status_code == 200
        assert rx.content[:4] == b"%PDF"


# --- Audit ---
class TestAudit:
    def test_audit_list(self, http, demo_headers):
        r = http.get(f"{API}/audit", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_audit_individual_breakdown(self, http, demo_headers):
        # Use a seeded demo respondent
        rr = http.get(f"{API}/respondents", headers=demo_headers, timeout=15)
        rid = rr.json()[0]["id"]
        r = http.get(f"{API}/audit/individual/{rid}", headers=demo_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert len(j["breakdown"]) > 0
        for row in j["breakdown"]:
            assert "formula" in row and "%" in row["formula"]

    def test_audit_individual_not_found(self, http, demo_headers):
        r = http.get(f"{API}/audit/individual/nope", headers=demo_headers, timeout=15)
        assert r.status_code == 404


# --- Auth negative ---
def test_missing_auth_header(http):
    r = http.get(f"{API}/schools", timeout=15)
    assert r.status_code == 401
