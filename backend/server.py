from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging
import os
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="AUM Umum BK API")
api_router = APIRouter(prefix="/api")
logger = logging.getLogger("aum_bk")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def expand_ranges(ranges: List[str]) -> List[int]:
    values: List[int] = []
    for range_text in ranges:
        start, end = [int(part) for part in range_text.split("-")]
        values.extend(range(start, end + 1))
    return values


DOMAIN_NAMES = {
    "JDK": "Jasmani dan Kesehatan",
    "DPI": "Diri Pribadi",
    "HSO": "Hubungan Sosial",
    "EDK": "Ekonomi dan Keuangan",
    "KDP": "Karir dan Pekerjaan",
    "PDP": "Pendidikan dan Pelajaran",
    "ANM": "Agama, Nilai dan Moral",
    "HMM": "Hubungan Muda-Mudi",
    "HPW": "Hubungan Pria-Wanita",
    "KHK": "Keadaan dan Hubungan dalam Keluarga",
    "WSG": "Waktu Senggang",
}


# The seed keeps the source ranges as editable configuration data. Some scans of
# the source tables contain overlapping/unclear ranges, so repair_ranges keeps
# each official item unique and fills only missing slots to preserve totals.
FORMAT_SPECS = [
    {
        "id": "format_1",
        "code": "F1",
        "name": "Format 1",
        "target": "Siswa SD",
        "total_items": 75,
        "domain_counts": {"JDK": 15, "DPI": 10, "HSO": 10, "EDK": 5, "PDP": 10, "ANM": 5, "KHK": 20},
        "ranges": {
            "JDK": ["006-010", "026-030", "046-050"],
            "DPI": ["056-060", "066-070"],
            "HSO": ["011-015", "031-035"],
            "EDK": ["071-075"],
            "PDP": ["016-020", "036-040"],
            "ANM": ["061-065"],
            "KHK": ["001-005", "021-025", "041-045", "051-055"],
        },
    },
    {
        "id": "format_2",
        "code": "F2",
        "name": "Format 2",
        "target": "Siswa SLTP",
        "total_items": 155,
        "domain_counts": {"JDK": 20, "DPI": 25, "HSO": 35, "EDK": 10, "KDP": 5, "PDP": 15, "ANM": 10, "HMM": 5, "KHK": 25, "WSG": 5},
        "ranges": {
            "JDK": ["001-005", "006-010", "026-030", "051-055", "056-066"],
            "DPI": ["016-020", "041-045", "066-070"],
            "HSO": ["011-015", "036-040", "061-065", "076-080", "081-085", "101-105"],
            "EDK": ["111-115", "136-140"], "KDP": ["116-120", "141-145"],
            "PDP": ["126-130"], "ANM": ["106-110", "131-135", "146-150"],
            "HMM": ["121-125"], "KHK": ["151-155"],
            "WSG": ["021-025", "046-050", "071-075", "091-095", "101-105"],
        },
    },
    {
        "id": "format_3",
        "code": "F3",
        "name": "Format 3",
        "target": "Siswa SLTA",
        "total_items": 200,
        "domain_counts": {"JDK": 25, "DPI": 15, "HSO": 35, "EDK": 10, "KDP": 15, "PDP": 15, "ANM": 30, "HMM": 20, "KHK": 25, "WSG": 10},
        "ranges": {
            "JDK": ["076-080", "101-105"], "DPI": ["001-005", "026-030", "051-055", "086-090", "111-115", "131-135"],
            "HSO": ["011-015", "036-040", "061-065", "081-085", "106-110", "126-130"],
            "EDK": ["006-010", "031-035", "056-060"], "KDP": ["141-145"],
            "PDP": ["146-150", "166-170"], "ANM": ["016-020", "041-045", "066-070", "091-095", "116-120", "136-140"],
            "HMM": ["156-160", "176-180", "191-195", "196-200"],
            "KHK": ["021-025", "046-050", "071-075", "096-100", "121-125", "181-185"], "WSG": ["161-165", "181-185"],
        },
    },
    {
        "id": "format_4",
        "code": "F4",
        "name": "Format 4",
        "target": "Mahasiswa Perguruan Tinggi",
        "total_items": 210,
        "domain_counts": {"JDK": 25, "DPI": 20, "HSO": 40, "EDK": 15, "KDP": 15, "PDP": 10, "ANM": 25, "HMM": 15, "KHK": 35, "WSG": 10},
        "ranges": {
            "JDK": ["001-005", "026-030", "051-055", "076-080", "101-105"], "DPI": ["006-010", "031-035", "056-060", "081-085"],
            "HSO": ["011-015", "036-040", "061-065", "071-075", "091-095", "096-100", "111-115", "116-120", "121-125", "126-130", "131-135", "136-140", "141-145"],
            "EDK": ["161-165", "186-190", "201-205"], "KDP": ["166-170", "191-195", "206-210"], "PDP": ["146-150", "171-175"],
            "ANM": ["011-015", "036-040", "061-065", "086-090", "106-110"], "HMM": ["156-160", "181-185", "196-200"],
            "KHK": ["016-020", "041-050", "066-070", "091-095", "111-115", "121-125", "131-135"], "WSG": ["151-155", "176-180"],
        },
    },
    {
        "id": "format_5",
        "code": "F5",
        "name": "Format 5",
        "target": "Warga Masyarakat",
        "total_items": 265,
        "domain_counts": {"JDK": 30, "DPI": 35, "HSO": 55, "KDP": 30, "EDK": 20, "PDP": 5, "ANM": 15, "HPW": 35, "KHK": 30, "WSG": 10},
        "ranges": {
            "JDK": ["011-015", "036-040", "061-065", "086-090", "111-115", "131-135"], "DPI": ["146-150", "171-175", "196-200", "216-220", "231-235", "241-246", "251-255"],
            "HSO": ["001-005", "006-010", "026-030", "031-035", "051-055", "056-060", "076-080", "081-085", "101-105", "106-110", "126-130"],
            "KDP": ["021-025", "046-050", "071-075", "096-100", "121-125", "141-145"], "EDK": ["156-160", "181-185", "206-210", "226-230"],
            "PDP": ["261-265"], "ANM": ["161-165", "186-190", "211-215"],
            "HPW": ["151-155", "176-180", "201-205", "221-225", "236-240", "246-250", "256-260"],
            "KHK": ["016-020", "041-045", "066-070", "091-095", "116-120", "136-140"], "WSG": ["166-170", "191-195"],
        },
    },
]


def repair_ranges(spec: Dict[str, Any]) -> Dict[int, Dict[str, str]]:
    assigned: Dict[int, str] = {}
    domains = list(spec["domain_counts"].keys())
    for domain in domains:
        for number in expand_ranges(spec["ranges"].get(domain, [])):
            if 1 <= number <= spec["total_items"] and number not in assigned and sum(1 for value in assigned.values() if value == domain) < spec["domain_counts"][domain]:
                assigned[number] = domain
    for domain in domains:
        current = sum(1 for value in assigned.values() if value == domain)
        for number in range(1, spec["total_items"] + 1):
            if current >= spec["domain_counts"][domain]:
                break
            if number not in assigned:
                assigned[number] = domain
                current += 1
    if len(assigned) != spec["total_items"] or any(sum(1 for value in assigned.values() if value == d) != count for d, count in spec["domain_counts"].items()):
        raise RuntimeError(f"SYSTEM ERROR — konfigurasi {spec['name']} tidak konsisten")
    return {number: {"code": domain, "name": DOMAIN_NAMES[domain]} for number, domain in sorted(assigned.items())}


FORMATS: Dict[str, Dict[str, Any]] = {}
for raw in FORMAT_SPECS:
    config = {**raw, "domains": [{"code": code, "name": DOMAIN_NAMES[code], "item_count": count} for code, count in raw["domain_counts"].items()]}
    config["item_mapping"] = repair_ranges(raw)
    FORMATS[raw["id"]] = config


class LoginInput(BaseModel):
    email: str
    password: str


class RespondentInput(BaseModel):
    mode: str = "demo"
    name: str
    respondent_id: str = Field(default="")
    gender: str = ""
    birth_place: str = ""
    birth_date: str = ""
    institution: str = ""
    class_name: str = ""
    major: str = ""
    filled_date: str = ""
    academic_year: str = "2025/2026"
    format_id: str
    class_id: str = ""
    selected_problem_numbers: List[int] = Field(default_factory=list)
    heavy_problem_numbers: List[int] = Field(default_factory=list)
    third_step: Dict[str, Any] = Field(default_factory=dict)


class GroupInput(BaseModel):
    format_id: str
    respondent_ids: List[str] = Field(default_factory=list)
    class_id: str = ""


def format_public(config: Dict[str, Any]) -> Dict[str, Any]:
    return {"id": config["id"], "code": config["code"], "name": config["name"], "target": config["target"], "total_items": config["total_items"], "domains": config["domains"]}


def validate_selection(format_id: str, selected: List[int], heavy: List[int]) -> Dict[int, Dict[str, str]]:
    config = FORMATS.get(format_id)
    if not config:
        raise HTTPException(400, "Format AUM tidak ditemukan.")
    mapping = config["item_mapping"]
    if len(set(selected)) != len(selected):
        raise HTTPException(400, "Nomor masalah tidak boleh duplikat.")
    if any(number not in mapping for number in selected):
        raise HTTPException(400, f"Data belum dapat diproses karena ada nomor masalah di luar Format {config['code'][-1]}.")
    if not set(heavy).issubset(set(selected)):
        raise HTTPException(400, "Masalah berat harus berasal dari masalah yang dipilih pada Langkah Pertama.")
    return mapping


def score_individual(format_id: str, selected: List[int], heavy: List[int]) -> Dict[str, Any]:
    config = FORMATS[format_id]
    mapping = validate_selection(format_id, selected, heavy)
    rows: List[Dict[str, Any]] = []
    for domain in config["domains"]:
        code = domain["code"]
        domain_selected = sorted(number for number in selected if mapping[number]["code"] == code)
        domain_heavy = sorted(number for number in heavy if mapping[number]["code"] == code)
        count = len(domain_selected)
        percentage = round((count / domain["item_count"]) * 100, 2)
        rows.append({"domain_code": code, "domain_name": domain["name"], "item_count": domain["item_count"], "problem_numbers": domain_selected, "count": count, "percentage": percentage, "heavy_problem_numbers": domain_heavy, "heavy_count": len(domain_heavy)})
    total = len(selected)
    return {
        "format_id": format_id,
        "total_items": config["total_items"],
        "selected_problem_numbers": sorted(selected),
        "heavy_problem_numbers": sorted(heavy),
        "total_problems": total,
        "overall_percentage": round((total / config["total_items"]) * 100, 2),
        "total_heavy_problems": len(heavy),
        "rows": rows,
        "audit": {"formula": "persentase = (jumlah masalah pada bidang / jumlah item bidang) × 100", "selected_count": total, "heavy_count": len(heavy), "mapping_checked": True},
    }


async def seed_database() -> None:
    if await db.aum_formats.count_documents({}) == 0:
        await db.aum_formats.insert_many([{**format_public(config), "ranges": config["ranges"], "domain_counts": config["domain_counts"], "mode": "official_source"} for config in FORMATS.values()])
    if await db.aum_items.count_documents({}) == 0:
        items = []
        for config in FORMATS.values():
            for number, domain in config["item_mapping"].items():
                items.append({"id": uid("item"), "format_id": config["id"], "item_number": number, "domain_code": domain["code"], "domain_name": domain["name"]})
        await db.aum_items.insert_many(items)
    if await db.schools.count_documents({"mode": "demo"}) == 0:
        school_id, class_a, class_b = "demo_school", "demo_class_vii_a", "demo_class_vii_b"
        await db.schools.insert_one({"id": school_id, "mode": "demo", "name": "SMP Harapan Bangsa", "academic_year": "2025/2026", "levels": ["SLTP"]})
        await db.classes.insert_many([
            {"id": class_a, "mode": "demo", "school_id": school_id, "name": "VII A", "level": "SLTP", "format_id": "format_2"},
            {"id": class_b, "mode": "demo", "school_id": school_id, "name": "VII B", "level": "SLTP", "format_id": "format_2"},
        ])
        demo_people = [
            ("Nadia Putri", "P", [1, 7, 17, 42, 77, 107], [42]), ("Raka Pratama", "L", [2, 12, 22, 52, 117], [12, 52]),
            ("Salsa Aulia", "P", [3, 8, 18, 63, 132, 152], [18]), ("Bima Aditya", "L", [4, 14, 24, 57, 122, 147], [57]),
        ]
        for index, (name, gender, selected, heavy) in enumerate(demo_people):
            respondent_id = f"demo_resp_{index + 1}"
            result = score_individual("format_2", selected, heavy)
            await db.respondents.insert_one({"id": respondent_id, "mode": "demo", "name": name, "respondent_id": f"D-{index + 1:03}", "gender": gender, "institution": "SMP Harapan Bangsa", "class_name": "VII A" if index < 2 else "VII B", "class_id": class_a if index < 2 else class_b, "academic_year": "2025/2026", "filled_date": "2026-09-09", "format_id": "format_2", "selected_problem_numbers": selected, "heavy_problem_numbers": heavy, "third_step": {"complete": "Ya", "other_problems": "", "want_discussion": "Ya", "discussion_with": "Guru BK"}, "created_at": datetime.now(timezone.utc).isoformat()})
            await db.processing_results.insert_one({"id": uid("result"), "mode": "demo", "respondent_id": respondent_id, "result": result, "created_at": datetime.now(timezone.utc).isoformat()})


@app.on_event("startup")
async def startup() -> None:
    await seed_database()


@api_router.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "aum-umum-bk"}


@api_router.post("/auth/login")
async def login(payload: LoginInput) -> Dict[str, Any]:
    if payload.email != "guru@aum.local" or payload.password != "demo123":
        raise HTTPException(401, "Email atau kata sandi belum sesuai.")
    return {"token": "demo-session", "user": {"name": "Guru BK Demo", "email": payload.email}, "mode": "demo"}


@api_router.post("/auth/demo")
async def demo_login() -> Dict[str, Any]:
    return {"token": "demo-session", "user": {"name": "Guru BK Demo", "email": "guru@aum.local"}, "mode": "demo"}


@api_router.get("/formats")
async def formats() -> List[Dict[str, Any]]:
    return [format_public(config) for config in FORMATS.values()]


@api_router.get("/schools")
async def schools(mode: str = Query("demo")) -> List[Dict[str, Any]]:
    return await db.schools.find({"mode": mode}, {"_id": 0}).to_list(100)


@api_router.get("/classes")
async def classes(school_id: str, mode: str = Query("demo")) -> List[Dict[str, Any]]:
    return await db.classes.find({"school_id": school_id, "mode": mode}, {"_id": 0}).to_list(100)


@api_router.get("/respondents")
async def respondents(class_id: Optional[str] = None, mode: str = Query("demo")) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {"mode": mode}
    if class_id:
        query["class_id"] = class_id
    return await db.respondents.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/dashboard")
async def dashboard(mode: str = Query("demo")) -> Dict[str, Any]:
    people = await db.respondents.find({"mode": mode}, {"_id": 0, "id": 1, "selected_problem_numbers": 1, "heavy_problem_numbers": 1, "format_id": 1, "class_id": 1, "class_name": 1, "name": 1, "created_at": 1}).to_list(1000)
    total_problems = sum(len(person.get("selected_problem_numbers", [])) for person in people)
    total_heavy = sum(len(person.get("heavy_problem_numbers", [])) for person in people)
    return {"respondent_count": len(people), "class_count": len({person.get("class_id") for person in people}), "total_problems": total_problems, "total_heavy": total_heavy, "average_problems": round(total_problems / len(people), 2) if people else 0, "recent": people[:5]}


@api_router.post("/respondents")
async def create_respondent(payload: RespondentInput) -> Dict[str, Any]:
    selected = sorted(set(payload.selected_problem_numbers))
    heavy = sorted(set(payload.heavy_problem_numbers))
    result = score_individual(payload.format_id, selected, heavy)
    respondent_id = payload.respondent_id or uid("resp")
    raw = payload.model_dump()
    raw.update({"id": respondent_id, "selected_problem_numbers": selected, "heavy_problem_numbers": heavy, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.respondents.insert_one(raw)
    result_id = uid("result")
    await db.processing_results.insert_one({"id": result_id, "mode": payload.mode, "respondent_id": respondent_id, "result": result, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.audit_logs.insert_one({"id": uid("audit"), "mode": payload.mode, "action": "score_individual", "respondent_id": respondent_id, "details": result["audit"], "created_at": datetime.now(timezone.utc).isoformat()})
    return {"respondent": {**raw, "_id": None}, "result_id": result_id, "result": result}


@api_router.post("/scoring/individual")
async def scoring_individual(payload: RespondentInput) -> Dict[str, Any]:
    return score_individual(payload.format_id, sorted(set(payload.selected_problem_numbers)), sorted(set(payload.heavy_problem_numbers)))


@api_router.post("/scoring/group")
async def scoring_group(payload: GroupInput) -> Dict[str, Any]:
    query: Dict[str, Any] = {"format_id": payload.format_id}
    if payload.respondent_ids:
        query["id"] = {"$in": payload.respondent_ids}
    elif payload.class_id:
        query["class_id"] = payload.class_id
    people = await db.respondents.find(query, {"_id": 0}).to_list(1000)
    if not people:
        raise HTTPException(404, "Belum ada responden pada kelompok ini.")
    individual = [score_individual(payload.format_id, person.get("selected_problem_numbers", []), person.get("heavy_problem_numbers", [])) for person in people]
    config = FORMATS[payload.format_id]
    rows = []
    for domain in config["domains"]:
        domain_rows = [next(row for row in result["rows"] if row["domain_code"] == domain["code"]) for result in individual]
        total = sum(row["count"] for row in domain_rows)
        heavy_total = sum(row["heavy_count"] for row in domain_rows)
        rows.append({"domain_code": domain["code"], "domain_name": domain["name"], "lowest": min(row["count"] for row in domain_rows), "highest": max(row["count"] for row in domain_rows), "total": total, "percentage": round((total / domain["item_count"] / len(people)) * 100, 2), "average": round(total / len(people), 2), "heavy_total": heavy_total, "heavy_average": round(heavy_total / len(people), 2)})
    total = sum(len(person.get("selected_problem_numbers", [])) for person in people)
    heavy_total = sum(len(person.get("heavy_problem_numbers", [])) for person in people)
    return {"format_id": payload.format_id, "respondent_count": len(people), "total_problems": total, "average_problems": round(total / len(people), 2), "total_heavy_problems": heavy_total, "average_heavy_problems": round(heavy_total / len(people), 2), "rows": rows, "contributors": [{"id": person["id"], "name": person["name"], "total": len(person.get("selected_problem_numbers", [])), "heavy_total": len(person.get("heavy_problem_numbers", []))} for person in people], "audit": {"formula": "persentase kelompok = JML / jumlah item bidang / jumlah pengisi AUM × 100", "respondent_count": len(people)}}


@api_router.get("/results/individual/{respondent_id}")
async def individual_result(respondent_id: str) -> Dict[str, Any]:
    person = await db.respondents.find_one({"id": respondent_id}, {"_id": 0})
    if not person:
        raise HTTPException(404, "Responden tidak ditemukan.")
    return {"respondent": person, "result": score_individual(person["format_id"], person.get("selected_problem_numbers", []), person.get("heavy_problem_numbers", []))}


@api_router.get("/audit")
async def audit(mode: str = Query("demo")) -> List[Dict[str, Any]]:
    return await db.audit_logs.find({"mode": mode}, {"_id": 0}).sort("created_at", -1).to_list(100)


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()