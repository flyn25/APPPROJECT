from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging
import os
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import bcrypt
import io
import jwt
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="AUM Umum BK API")
api_router = APIRouter(prefix="/api")
logger = logging.getLogger("aum_bk")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
JWT_SECRET = os.environ.get("JWT_SECRET", "aum-bk-development-secret")
JWT_ALGORITHM = "HS256"


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
    """Deterministic best-effort mapping: honour explicit ranges when unique,
    then fill remaining slots sequentially so every official item is covered
    and every domain reaches its official count.
    """
    assigned: Dict[int, str] = {}
    domains = list(spec["domain_counts"].keys())
    # Pass 1: assign explicit ranges (first come, first served)
    for domain in domains:
        for number in expand_ranges(spec["ranges"].get(domain, [])):
            if 1 <= number <= spec["total_items"] and number not in assigned and sum(1 for value in assigned.values() if value == domain) < spec["domain_counts"][domain]:
                assigned[number] = domain
    # Pass 2: fill missing numbers by rotating through short domains
    remaining_numbers = [n for n in range(1, spec["total_items"] + 1) if n not in assigned]
    for number in remaining_numbers:
        # Pick the domain most under-quota (deterministic order by declared list)
        candidates = [d for d in domains if sum(1 for value in assigned.values() if value == d) < spec["domain_counts"][d]]
        if not candidates:
            break
        assigned[number] = candidates[0]
    if len(assigned) != spec["total_items"] or any(sum(1 for value in assigned.values() if value == d) != count for d, count in spec["domain_counts"].items()):
        raise RuntimeError(f"SYSTEM ERROR — konfigurasi {spec['name']} tidak konsisten")
    return {number: {"code": domain, "name": DOMAIN_NAMES[domain]} for number, domain in sorted(assigned.items())}


FORMATS: Dict[str, Dict[str, Any]] = {}
for raw in FORMAT_SPECS:
    config = {**raw, "domains": [{"code": code, "name": DOMAIN_NAMES[code], "item_count": count} for code, count in raw["domain_counts"].items()]}
    config["item_mapping"] = repair_ranges(raw)
    config["mapping_status"] = "source_conflict_provisional" if raw["id"] in {"format_2", "format_3", "format_4", "format_5"} else "source_consistent"
    config["mapping_notes"] = "Rentang pada PDF sumber bertentangan/berulang; jumlah item resmi dipertahankan dan repair deterministik ditandai provisional." if config["mapping_status"] != "source_consistent" else "Rentang dan komposisi konsisten pada transkripsi sumber."
    FORMATS[raw["id"]] = config


class LoginInput(BaseModel):
    email: str
    password: str


class RegisterInput(BaseModel):
    name: str
    email: str
    password: str


class CurrentUser(BaseModel):
    user_id: str
    name: str
    email: str


class RespondentInput(BaseModel):
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


class SchoolInput(BaseModel):
    name: str
    academic_year: str = "2025/2026"
    levels: List[str] = Field(default_factory=list)


class SchoolPatch(BaseModel):
    name: Optional[str] = None
    academic_year: Optional[str] = None


class BulkRespondentItem(BaseModel):
    name: str
    respondent_id: str = ""
    gender: str = ""
    selected_problem_numbers: List[int] = Field(default_factory=list)
    heavy_problem_numbers: List[int] = Field(default_factory=list)
    third_step: Dict[str, Any] = Field(default_factory=dict)


class BulkInput(BaseModel):
    class_id: str
    format_id: str
    academic_year: str = ""
    filled_date: str = ""
    items: List[BulkRespondentItem]


class KonselingPatch(BaseModel):
    status: str
    note: str = ""


class ClassInput(BaseModel):
    school_id: str
    name: str
    level: str = "SLTP"
    format_id: str


def format_public(config: Dict[str, Any]) -> Dict[str, Any]:
    return {"id": config["id"], "code": config["code"], "name": config["name"], "target": config["target"], "total_items": config["total_items"], "domains": config["domains"], "mapping_status": config["mapping_status"], "mapping_notes": config["mapping_notes"]}


def make_token(user: Dict[str, Any]) -> str:
    return jwt.encode({"sub": user["id"], "name": user["name"], "email": user["email"]}, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def current_user(authorization: Optional[str] = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Sesi login diperlukan.")
    try:
        payload = jwt.decode(authorization.split(" ", 1)[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return CurrentUser(user_id=str(payload["sub"]), name=str(payload["name"]), email=str(payload["email"]))
    except (jwt.PyJWTError, KeyError, ValueError) as error:
        logger.info("Invalid auth token: %s", error)
        raise HTTPException(401, "Sesi login tidak valid atau sudah berakhir.") from error


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
    mapping = validate_selection(format_id, selected, heavy)
    config = FORMATS[format_id]
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
    # Mode demo dihapus: bersihkan data demo lama dan pastikan setiap responden punya owner_id.
    for collection in (db.users, db.schools, db.classes, db.respondents, db.processing_results, db.audit_logs):
        await collection.delete_many({"mode": "demo"})
    async for person in db.respondents.find({"owner_id": {"$exists": False}}, {"_id": 0, "id": 1, "class_id": 1}):
        cls = await db.classes.find_one({"id": person.get("class_id")}, {"_id": 0, "owner_id": 1})
        if cls and cls.get("owner_id"):
            await db.respondents.update_one({"id": person["id"]}, {"$set": {"owner_id": cls["owner_id"]}})


@app.on_event("startup")
async def startup() -> None:
    await seed_database()


@api_router.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "aum-umum-bk"}


@api_router.post("/auth/login")
async def login(payload: LoginInput) -> Dict[str, Any]:
    user = await db.users.find_one({"email": payload.email.lower().strip()}, {"_id": 0})
    if not user or not bcrypt.checkpw(payload.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Email atau kata sandi belum sesuai.")
    return {"token": make_token(user), "user": {"name": user["name"], "email": user["email"]}}


@api_router.post("/auth/register")
async def register(payload: RegisterInput) -> Dict[str, Any]:
    email = payload.email.lower().strip()
    if len(payload.name.strip()) < 2 or "@" not in email:
        raise HTTPException(400, "Nama dan email harus diisi dengan benar.")
    if len(payload.password) < 8:
        raise HTTPException(400, "Kata sandi minimal 8 karakter.")
    if await db.users.find_one({"email": email}, {"_id": 0}):
        raise HTTPException(409, "Email sudah terdaftar. Silakan masuk.")
    user = {"id": uid("user"), "name": payload.name.strip(), "email": email, "password_hash": bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(user)
    return {"token": make_token(user), "user": {"name": user["name"], "email": user["email"]}}


@api_router.get("/auth/me")
async def me(user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    return {"user": {"name": user.name, "email": user.email}}


@api_router.get("/formats")
async def formats() -> List[Dict[str, Any]]:
    return [format_public(config) for config in FORMATS.values()]


@api_router.get("/formats/verification")
async def format_verification() -> List[Dict[str, Any]]:
    return [{"format_id": config["id"], "code": config["code"], "status": config["mapping_status"], "total_items": config["total_items"], "domain_total": sum(domain["item_count"] for domain in config["domains"]), "unique_item_total": len(config["item_mapping"]), "notes": config["mapping_notes"]} for config in FORMATS.values()]


@api_router.get("/schools")
async def schools(user: CurrentUser = Depends(current_user)) -> List[Dict[str, Any]]:
    return await db.schools.find({"owner_id": user.user_id}, {"_id": 0}).to_list(100)


@api_router.post("/schools")
async def create_school(payload: SchoolInput, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    if not payload.name.strip():
        raise HTTPException(400, "Nama sekolah wajib diisi.")
    school = {
        "id": uid("school"),
        "owner_id": user.user_id,
        "owner_id": user.user_id,
        "name": payload.name.strip(),
        "academic_year": payload.academic_year.strip() or "2025/2026",
        "levels": [level for level in payload.levels if level] or ["SLTP"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.schools.insert_one(school)
    return {k: v for k, v in school.items() if k != "_id"}


@api_router.get("/classes")
async def classes(school_id: str, user: CurrentUser = Depends(current_user)) -> List[Dict[str, Any]]:
    return await db.classes.find({"school_id": school_id, "owner_id": user.user_id}, {"_id": 0}).to_list(100)


@api_router.post("/classes")
async def create_class(payload: ClassInput, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    if payload.format_id not in FORMATS:
        raise HTTPException(400, "Format AUM tidak dikenal.")
    if not payload.name.strip():
        raise HTTPException(400, "Nama kelas wajib diisi.")
    school = await db.schools.find_one({"id": payload.school_id, "owner_id": user.user_id}, {"_id": 0})
    if not school:
        raise HTTPException(404, "Sekolah tidak ditemukan.")
    doc = {
        "id": uid("class"),
        "owner_id": user.user_id,
        "owner_id": user.user_id,
        "school_id": payload.school_id,
        "name": payload.name.strip(),
        "level": payload.level.strip() or "SLTP",
        "format_id": payload.format_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.classes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.get("/respondents")
async def respondents(class_id: Optional[str] = None, user: CurrentUser = Depends(current_user)) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {"owner_id": user.user_id}
    if class_id:
        query["class_id"] = class_id
    return await db.respondents.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/dashboard")
async def dashboard(user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    people = await db.respondents.find({"owner_id": user.user_id}, {"_id": 0, "id": 1, "selected_problem_numbers": 1, "heavy_problem_numbers": 1, "format_id": 1, "class_id": 1, "class_name": 1, "name": 1, "created_at": 1}).to_list(1000)
    total_problems = sum(len(person.get("selected_problem_numbers", [])) for person in people)
    total_heavy = sum(len(person.get("heavy_problem_numbers", [])) for person in people)
    return {"respondent_count": len(people), "class_count": len({person.get("class_id") for person in people}), "total_problems": total_problems, "total_heavy": total_heavy, "average_problems": round(total_problems / len(people), 2) if people else 0, "recent": people[:5]}


@api_router.post("/respondents")
async def create_respondent(payload: RespondentInput, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    selected = sorted(set(payload.selected_problem_numbers))
    heavy = sorted(set(payload.heavy_problem_numbers))
    result = score_individual(payload.format_id, selected, heavy)
    respondent_id = payload.respondent_id or uid("resp")
    raw = payload.model_dump()
    raw["owner_id"] = user.user_id
    raw.update({"id": respondent_id, "selected_problem_numbers": selected, "heavy_problem_numbers": heavy, "konseling_status": "Belum", "created_at": datetime.now(timezone.utc).isoformat()})
    await db.respondents.insert_one(raw)
    result_id = uid("result")
    await db.processing_results.insert_one({"id": result_id, "owner_id": user.user_id, "respondent_id": respondent_id, "result": result, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.audit_logs.insert_one({"id": uid("audit"), "owner_id": user.user_id, "action": "score_individual", "respondent_id": respondent_id, "details": result["audit"], "created_at": datetime.now(timezone.utc).isoformat()})
    return {"respondent": {**raw, "_id": None}, "result_id": result_id, "result": result}


@api_router.post("/scoring/individual")
async def scoring_individual(payload: RespondentInput, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    return score_individual(payload.format_id, sorted(set(payload.selected_problem_numbers)), sorted(set(payload.heavy_problem_numbers)))


@api_router.post("/scoring/group")
async def scoring_group(payload: GroupInput, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    query: Dict[str, Any] = {"format_id": payload.format_id, "owner_id": user.user_id}
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
    return {"format_id": payload.format_id, "respondent_count": len(people), "total_problems": total, "average_problems": round(total / len(people), 2), "total_heavy_problems": heavy_total, "average_heavy_problems": round(heavy_total / len(people), 2), "rows": rows, "contributors": [{"id": person["id"], "name": person["name"], "total": len(person.get("selected_problem_numbers", [])), "heavy_total": len(person.get("heavy_problem_numbers", []))} for person in people], "consultation": consult_counts(people), "audit": {"formula": "persentase kelompok = JML / jumlah item bidang / jumlah pengisi AUM × 100", "respondent_count": len(people)}}


@api_router.get("/results/individual/{respondent_id}")
async def individual_result(respondent_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    person = await db.respondents.find_one({"id": respondent_id, "owner_id": user.user_id}, {"_id": 0})
    if not person:
        raise HTTPException(404, "Responden tidak ditemukan.")
    return {"respondent": person, "result": score_individual(person["format_id"], person.get("selected_problem_numbers", []), person.get("heavy_problem_numbers", []))}


@api_router.get("/audit")
async def audit(user: CurrentUser = Depends(current_user)) -> List[Dict[str, Any]]:
    return await db.audit_logs.find({"owner_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.get("/rekap/school/{school_id}")
async def rekap_school(school_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    school = await db.schools.find_one({"id": school_id, "owner_id": user.user_id}, {"_id": 0})
    if not school:
        raise HTTPException(404, "Sekolah tidak ditemukan.")
    class_list = await db.classes.find({"school_id": school_id, "owner_id": user.user_id}, {"_id": 0}).to_list(200)
    people = await db.respondents.find({"class_id": {"$in": [c["id"] for c in class_list]}, "owner_id": user.user_id}, {"_id": 0}).to_list(2000)
    total_problems = sum(len(p.get("selected_problem_numbers", [])) for p in people)
    total_heavy = sum(len(p.get("heavy_problem_numbers", [])) for p in people)
    # per-domain aggregation across all classes/formats in the school
    domain_totals: Dict[str, Dict[str, Any]] = {}
    for person in people:
        config = FORMATS.get(person.get("format_id"))
        if not config:
            continue
        mapping = config["item_mapping"]
        for number in person.get("selected_problem_numbers", []):
            code = mapping.get(number, {}).get("code")
            if not code:
                continue
            slot = domain_totals.setdefault(code, {"code": code, "name": DOMAIN_NAMES.get(code, code), "total": 0, "heavy": 0})
            slot["total"] += 1
        for number in person.get("heavy_problem_numbers", []):
            code = mapping.get(number, {}).get("code")
            if code:
                domain_totals.setdefault(code, {"code": code, "name": DOMAIN_NAMES.get(code, code), "total": 0, "heavy": 0})["heavy"] += 1
    domain_rows = sorted(domain_totals.values(), key=lambda x: x["total"], reverse=True)
    # per-class summary
    class_summary = []
    for cls in class_list:
        members = [p for p in people if p.get("class_id") == cls["id"]]
        if not members:
            class_summary.append({"class_id": cls["id"], "name": cls["name"], "level": cls["level"], "respondent_count": 0, "total_problems": 0, "total_heavy": 0, "average_problems": 0})
            continue
        totals = sum(len(m.get("selected_problem_numbers", [])) for m in members)
        heavies = sum(len(m.get("heavy_problem_numbers", [])) for m in members)
        class_summary.append({"class_id": cls["id"], "name": cls["name"], "level": cls["level"], "respondent_count": len(members), "total_problems": totals, "total_heavy": heavies, "average_problems": round(totals / len(members), 2)})
    return {
        "school": school,
        "respondent_count": len(people),
        "class_count": len(class_list),
        "total_problems": total_problems,
        "total_heavy_problems": total_heavy,
        "average_problems": round(total_problems / len(people), 2) if people else 0,
        "domain_rows": domain_rows,
        "class_summary": class_summary,
        "audit": {"formula": "rekap sekolah = agregat data individual per bidang dan per kelas dalam satu sekolah"},
    }


@api_router.get("/rekap/comparison")
async def rekap_comparison(school_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    class_list = await db.classes.find({"school_id": school_id, "owner_id": user.user_id}, {"_id": 0}).to_list(200)
    if not class_list:
        return {"classes": [], "domains": []}
    people = await db.respondents.find({"class_id": {"$in": [c["id"] for c in class_list]}, "owner_id": user.user_id}, {"_id": 0}).to_list(2000)
    # collect all domain codes present in classes' formats
    domain_codes: List[str] = []
    seen = set()
    for cls in class_list:
        config = FORMATS.get(cls["format_id"])
        if not config:
            continue
        for domain in config["domains"]:
            if domain["code"] not in seen:
                seen.add(domain["code"])
                domain_codes.append(domain["code"])
    # matrix: rows = domains, columns = classes with counts
    matrix = []
    for code in domain_codes:
        row = {"code": code, "name": DOMAIN_NAMES.get(code, code), "cells": []}
        for cls in class_list:
            members = [p for p in people if p.get("class_id") == cls["id"]]
            config = FORMATS.get(cls["format_id"])
            count = 0
            if config and code in {d["code"] for d in config["domains"]}:
                mapping = config["item_mapping"]
                for person in members:
                    count += sum(1 for n in person.get("selected_problem_numbers", []) if mapping.get(n, {}).get("code") == code)
            row["cells"].append({"class_id": cls["id"], "class_name": cls["name"], "count": count, "respondents": len(members)})
        matrix.append(row)
    return {"classes": [{"id": c["id"], "name": c["name"], "level": c["level"], "format_id": c["format_id"]} for c in class_list], "domains": matrix}


@api_router.get("/rekap/trend")
async def rekap_trend(school_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    """Tren tahunan: agregasi per tahun ajaran (per bidang) untuk satu sekolah."""
    class_list = await db.classes.find({"school_id": school_id, "owner_id": user.user_id}, {"_id": 0}).to_list(200)
    people = await db.respondents.find({"class_id": {"$in": [c["id"] for c in class_list]}, "owner_id": user.user_id}, {"_id": 0}).to_list(5000)
    years: Dict[str, Dict[str, Any]] = {}
    for person in people:
        year = str(person.get("academic_year") or "Tanpa tahun")
        slot = years.setdefault(year, {"academic_year": year, "respondent_count": 0, "total_problems": 0, "total_heavy": 0, "domains": {}})
        slot["respondent_count"] += 1
        config = FORMATS.get(person.get("format_id"))
        if not config:
            continue
        mapping = config["item_mapping"]
        for number in person.get("selected_problem_numbers", []):
            code = mapping.get(number, {}).get("code")
            if code:
                slot["total_problems"] += 1
                slot["domains"].setdefault(code, {"total": 0, "heavy": 0})["total"] += 1
        for number in person.get("heavy_problem_numbers", []):
            code = mapping.get(number, {}).get("code")
            if code:
                slot["total_heavy"] += 1
                slot["domains"].setdefault(code, {"total": 0, "heavy": 0})["heavy"] += 1
    ordered_years = sorted(years.keys())
    domain_codes = [code for code in DOMAIN_NAMES if any(code in years[y]["domains"] for y in ordered_years)]
    series = []
    for code in domain_codes:
        points = []
        for year in ordered_years:
            slot = years[year]
            total = slot["domains"].get(code, {}).get("total", 0)
            points.append({"academic_year": year, "total": total, "heavy": slot["domains"].get(code, {}).get("heavy", 0), "average": round(total / slot["respondent_count"], 2) if slot["respondent_count"] else 0})
        series.append({"code": code, "name": DOMAIN_NAMES[code], "points": points})
    return {
        "years": [{"academic_year": y, "respondent_count": years[y]["respondent_count"], "total_problems": years[y]["total_problems"], "total_heavy": years[y]["total_heavy"], "average_problems": round(years[y]["total_problems"] / years[y]["respondent_count"], 2) if years[y]["respondent_count"] else 0} for y in ordered_years],
        "series": series,
        "audit": {"formula": "tren = agregat masalah per bidang dikelompokkan menurut tahun ajaran responden; rata-rata = total / jumlah responden tahun tsb"},
    }


@api_router.patch("/schools/{school_id}")
async def update_school(school_id: str, payload: SchoolPatch, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    updates = {key: value.strip() for key, value in payload.model_dump().items() if value is not None and value.strip()}
    if not updates:
        raise HTTPException(400, "Tidak ada perubahan.")
    result = await db.schools.find_one_and_update({"id": school_id, "owner_id": user.user_id}, {"$set": updates}, projection={"_id": 0}, return_document=True)
    if not result:
        raise HTTPException(404, "Sekolah tidak ditemukan.")
    return result


async def delete_respondent_docs(respondent_ids: List[str], user: CurrentUser) -> int:
    if not respondent_ids:
        return 0
    deleted = await db.respondents.delete_many({"id": {"$in": respondent_ids}, "owner_id": user.user_id})
    await db.processing_results.delete_many({"respondent_id": {"$in": respondent_ids}})
    return deleted.deleted_count


@api_router.delete("/respondents/{respondent_id}")
async def delete_respondent(respondent_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    person = await db.respondents.find_one({"id": respondent_id, "owner_id": user.user_id}, {"_id": 0, "name": 1})
    if not person:
        raise HTTPException(404, "Responden tidak ditemukan.")
    await delete_respondent_docs([respondent_id], user)
    await db.audit_logs.insert_one({"id": uid("audit"), "owner_id": user.user_id, "action": "delete_respondent", "respondent_id": respondent_id, "details": {"formula": f"Hapus responden {person['name']} beserta hasil olahannya"}, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"deleted": 1}


@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    cls = await db.classes.find_one({"id": class_id, "owner_id": user.user_id}, {"_id": 0})
    if not cls:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    ids = [p["id"] async for p in db.respondents.find({"class_id": class_id, "owner_id": user.user_id}, {"_id": 0, "id": 1})]
    removed = await delete_respondent_docs(ids, user)
    await db.classes.delete_one({"id": class_id, "owner_id": user.user_id})
    await db.audit_logs.insert_one({"id": uid("audit"), "owner_id": user.user_id, "action": "delete_class", "details": {"formula": f"Hapus kelas {cls['name']} beserta {removed} responden"}, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"deleted_class": 1, "deleted_respondents": removed}


@api_router.delete("/schools/{school_id}")
async def delete_school(school_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    school = await db.schools.find_one({"id": school_id, "owner_id": user.user_id}, {"_id": 0})
    if not school:
        raise HTTPException(404, "Sekolah tidak ditemukan.")
    class_ids = [c["id"] async for c in db.classes.find({"school_id": school_id, "owner_id": user.user_id}, {"_id": 0, "id": 1})]
    ids = [p["id"] async for p in db.respondents.find({"class_id": {"$in": class_ids}, "owner_id": user.user_id}, {"_id": 0, "id": 1})]
    removed = await delete_respondent_docs(ids, user)
    await db.classes.delete_many({"school_id": school_id, "owner_id": user.user_id})
    await db.schools.delete_one({"id": school_id, "owner_id": user.user_id})
    await db.audit_logs.insert_one({"id": uid("audit"), "owner_id": user.user_id, "action": "delete_school", "details": {"formula": f"Hapus sekolah {school['name']}: {len(class_ids)} kelas, {removed} responden"}, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"deleted_school": 1, "deleted_classes": len(class_ids), "deleted_respondents": removed}


@api_router.post("/respondents/bulk")
async def create_respondents_bulk(payload: BulkInput, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    cls = await db.classes.find_one({"id": payload.class_id, "owner_id": user.user_id}, {"_id": 0})
    if not cls:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    if payload.format_id not in FORMATS:
        raise HTTPException(400, "Format AUM tidak ditemukan.")
    if not payload.items:
        raise HTTPException(400, "Belum ada responden pada lembar kelas.")
    school = await db.schools.find_one({"id": cls["school_id"], "owner_id": user.user_id}, {"_id": 0})
    now = datetime.now(timezone.utc).isoformat()
    docs: List[Dict[str, Any]] = []
    results: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    for index, item in enumerate(payload.items, start=1):
        selected = sorted(set(item.selected_problem_numbers))
        heavy = sorted(set(item.heavy_problem_numbers))
        if not item.name.strip():
            errors.append({"row": index, "message": "Nama responden kosong."})
            continue
        if not selected:
            errors.append({"row": index, "name": item.name, "message": "Belum ada nomor masalah."})
            continue
        try:
            result = score_individual(payload.format_id, selected, heavy)
        except HTTPException as error:
            errors.append({"row": index, "name": item.name, "message": str(error.detail)})
            continue
        respondent_id = item.respondent_id.strip() or uid("resp")
        docs.append({"id": respondent_id, "owner_id": user.user_id, "name": item.name.strip(), "respondent_id": item.respondent_id.strip(), "gender": item.gender, "institution": school["name"] if school else "", "class_name": cls["name"], "class_id": cls["id"], "academic_year": payload.academic_year or (school or {}).get("academic_year", "2025/2026"), "filled_date": payload.filled_date or now[:10], "format_id": payload.format_id, "selected_problem_numbers": selected, "heavy_problem_numbers": heavy, "third_step": item.third_step, "konseling_status": "Belum", "created_at": now})
        results.append({"id": uid("result"), "owner_id": user.user_id, "respondent_id": respondent_id, "result": result, "created_at": now})
    if errors:
        raise HTTPException(422, {"message": "Lembar kelas belum tersimpan karena ada baris yang belum valid.", "row_errors": errors})
    await db.respondents.insert_many(docs)
    await db.processing_results.insert_many(results)
    await db.audit_logs.insert_one({"id": uid("audit"), "owner_id": user.user_id, "action": "bulk_score", "details": {"formula": f"Lembar kelas {cls['name']}: {len(docs)} responden dihitung deterministik", "rows": len(docs)}, "created_at": now})
    return {"saved": len(docs), "class_id": cls["id"]}


@api_router.get("/konseling")
async def konseling_board(school_id: Optional[str] = None, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    query: Dict[str, Any] = {"owner_id": user.user_id, "third_step.want_discussion": "Ya"}
    if school_id:
        class_ids = [c["id"] async for c in db.classes.find({"school_id": school_id, "owner_id": user.user_id}, {"_id": 0, "id": 1})]
        query["class_id"] = {"$in": class_ids}
    people = await db.respondents.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    items = []
    for person in people:
        items.append({"id": person["id"], "name": person["name"], "respondent_id": person.get("respondent_id", ""), "class_name": person.get("class_name", ""), "class_id": person.get("class_id", ""), "academic_year": person.get("academic_year", ""), "total_problems": len(person.get("selected_problem_numbers", [])), "total_heavy": len(person.get("heavy_problem_numbers", [])), "discussion_with": (person.get("third_step") or {}).get("discussion_with", ""), "other_problems": (person.get("third_step") or {}).get("other_problems", ""), "status": person.get("konseling_status", "Belum"), "note": person.get("konseling_note", ""), "created_at": person.get("created_at", "")})
    counts = {"Belum": 0, "Dijadwalkan": 0, "Selesai": 0}
    for item in items:
        counts[item["status"]] = counts.get(item["status"], 0) + 1
    return {"items": items, "counts": counts}


@api_router.patch("/respondents/{respondent_id}/konseling")
async def update_konseling(respondent_id: str, payload: KonselingPatch, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    if payload.status not in {"Belum", "Dijadwalkan", "Selesai"}:
        raise HTTPException(400, "Status konseling tidak dikenal.")
    result = await db.respondents.update_one({"id": respondent_id, "owner_id": user.user_id}, {"$set": {"konseling_status": payload.status, "konseling_note": payload.note.strip(), "konseling_updated_at": datetime.now(timezone.utc).isoformat()}})
    if not result.matched_count:
        raise HTTPException(404, "Responden tidak ditemukan.")
    return {"id": respondent_id, "status": payload.status, "note": payload.note.strip()}


@api_router.get("/audit/individual/{respondent_id}")
async def audit_individual(respondent_id: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    person = await db.respondents.find_one({"id": respondent_id, "owner_id": user.user_id}, {"_id": 0})
    if not person:
        raise HTTPException(404, "Responden tidak ditemukan.")
    result = score_individual(person["format_id"], person.get("selected_problem_numbers", []), person.get("heavy_problem_numbers", []))
    breakdown = []
    for row in result["rows"]:
        breakdown.append({
            "domain": f"{row['domain_code']} — {row['domain_name']}",
            "problem_numbers": [str(n).zfill(3) for n in row["problem_numbers"]],
            "count": row["count"],
            "item_count": row["item_count"],
            "formula": f"{row['count']} / {row['item_count']} × 100 = {row['percentage']}%",
            "percentage": row["percentage"],
            "heavy_numbers": [str(n).zfill(3) for n in row["heavy_problem_numbers"]],
        })
    return {"respondent": person, "format_id": person["format_id"], "breakdown": breakdown, "total_problems": result["total_problems"], "total_heavy": result["total_heavy_problems"], "overall_percentage": result["overall_percentage"]}


def parse_problem_numbers(value: Any) -> List[int]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return []
    # If the cell is already a numeric int-like value (pandas often coerces int
    # columns with NaNs to float), convert to int to avoid `1.0` -> ["1","0"].
    if isinstance(value, (int, float)) and not pd.isna(value):
        return [int(value)] if value == int(value) else []
    import re
    return sorted({int(number) for number in re.findall(r"\d+", str(value))})


def normalized_column(value: Any) -> str:
    return "".join(char for char in str(value).lower().strip() if char.isalnum())


def row_value(row: Any, aliases: List[str], default: Any = "") -> Any:
    for column in row.index:
        if normalized_column(column) in aliases:
            return row[column]
    return default


@api_router.get("/import/template")
async def import_template(user: CurrentUser = Depends(current_user)) -> StreamingResponse:
    workbook = pd.DataFrame([{"nama": "Contoh Responden", "id": "ID-001", "jenis_kelamin": "P", "sekolah": "Nama Sekolah", "kelas": "VII A", "format_id": "format_2", "nomor_masalah": "001; 006; 011", "masalah_berat": "001"}])
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        workbook.to_excel(writer, index=False, sheet_name="Data AUM")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=template-import-aum.xlsx"})


@api_router.post("/import/excel")
async def import_excel(file: UploadFile = File(...), user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    content = await file.read()
    try:
        if file.filename and file.filename.lower().endswith(".csv"):
            frame = pd.read_csv(io.BytesIO(content))
        else:
            frame = pd.read_excel(io.BytesIO(content), engine="openpyxl")
    except Exception as error:
        raise HTTPException(400, f"File tidak dapat dibaca sebagai Excel/CSV: {error}") from error
    if frame.empty:
        raise HTTPException(400, "File import tidak memiliki baris data.")
    raw_rows: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    for row_number, (_, row) in enumerate(frame.iterrows(), start=2):
        name = str(row_value(row, ["nama", "name"])).strip()
        format_value = str(row_value(row, ["formatid", "format", "kodeformat"])).strip().lower()
        format_id = format_value if format_value.startswith("format_") else next((key for key, config in FORMATS.items() if format_value in {config["code"].lower(), config["name"].lower()}), "")
        selected = parse_problem_numbers(row_value(row, ["nomormasalah", "masalahterpilih", "selectedproblemnumbers"]))
        heavy = parse_problem_numbers(row_value(row, ["masalahberat", "heavyproblemnumbers"]))
        row_errors: List[str] = []
        if not name:
            row_errors.append("Nama responden wajib diisi.")
        if format_id not in FORMATS:
            row_errors.append("Format AUM tidak valid.")
        else:
            try:
                validate_selection(format_id, selected, heavy)
            except HTTPException as validation_error:
                row_errors.append(str(validation_error.detail))
        if row_errors:
            errors.append({"row": row_number, "message": " ".join(row_errors)})
            continue
        selected_class = str(row_value(row, ["kelas", "class", "kelompok"])).strip()
        raw_rows.append({"id": uid("resp"), "owner_id": user.user_id, "name": name, "respondent_id": str(row_value(row, ["id", "nis", "nisn", "nim"])).strip(), "gender": str(row_value(row, ["jeniskelamin", "gender"])).strip(), "institution": str(row_value(row, ["sekolah", "lembaga", "institution"])).strip(), "class_name": selected_class, "class_id": str(row_value(row, ["classid"])).strip(), "format_id": format_id, "academic_year": str(row_value(row, ["tahunajaran", "academicyear"], "2025/2026")), "filled_date": str(row_value(row, ["tanggal", "tanggalmengisi", "filleddate"])).strip(), "selected_problem_numbers": selected, "heavy_problem_numbers": heavy, "third_step": {}, "created_at": datetime.now(timezone.utc).isoformat()})
    if errors:
        raise HTTPException(422, {"message": "Tidak ada data yang diimport karena terdapat kesalahan validasi.", "row_errors": errors})
    inserted_ids = [row["id"] for row in raw_rows]
    try:
        await db.respondents.insert_many(raw_rows, ordered=True)
        result_docs = []
        for raw in raw_rows:
            result_docs.append({"id": uid("result"), "owner_id": user.user_id, "respondent_id": raw["id"], "result": score_individual(raw["format_id"], raw["selected_problem_numbers"], raw["heavy_problem_numbers"]), "created_at": datetime.now(timezone.utc).isoformat()})
        await db.processing_results.insert_many(result_docs, ordered=True)
        await db.audit_logs.insert_one({"id": uid("audit"), "owner_id": user.user_id, "action": "import_excel", "details": {"rows": len(raw_rows), "transactional": True}, "created_at": datetime.now(timezone.utc).isoformat()})
    except Exception as error:
        await db.respondents.delete_many({"id": {"$in": inserted_ids}, "owner_id": user.user_id})
        raise HTTPException(500, "Import dibatalkan seluruhnya karena penyimpanan tidak selesai.") from error
    return {"imported": len(raw_rows), "rejected": 0, "transactional": True}


def xlsx_response(rows: List[Dict[str, Any]], filename: str) -> StreamingResponse:
    frame = pd.DataFrame(rows)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        frame.to_excel(writer, index=False, sheet_name="Hasil AUM")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename={filename}"})


CONSULT_TARGETS = ["Guru BK", "Teman", "Guru lain", "Orangtua", "Ahli lain", "Lain-lain"]


def intensity_label(percentage: float) -> str:
    """Label prioritas layanan (bukan diagnosis): ambang tetap & transparan."""
    if percentage >= 50:
        return "sangat perlu perhatian"
    if percentage >= 25:
        return "perlu perhatian"
    if percentage > 0:
        return "perlu dipantau"
    return "tidak ada masalah terungkap"


def group_label(percentage: float) -> str:
    if percentage >= 25:
        return "dirasakan mayoritas siswa"
    if percentage >= 10:
        return "dirasakan sebagian siswa"
    if percentage > 0:
        return "dirasakan sebagian kecil siswa"
    return "tidak ada masalah terungkap"


ANALYSIS_RULES = [
    "Bidang diurutkan menurut persentase masalah (JML / jumlah item bidang × 100).",
    "Label prioritas: ≥50% sangat perlu perhatian; 25–49% perlu perhatian; 1–24% perlu dipantau.",
    "Individual: ada masalah berat atau bidang ≥50% → konseling individual; bidang 25–49% → bimbingan kelompok; lainnya → layanan informasi/klasikal.",
    "Kelompok: persentase kelompok ≥25% → layanan klasikal; 10–24% → bimbingan kelompok; siswa dengan masalah berat terbanyak → kandidat konseling individual.",
    "Analisis bersifat deskriptif untuk pertimbangan Guru BK, bukan diagnosis psikologis.",
]


def analyze_individual(person: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
    rows = sorted(result["rows"], key=lambda r: (r["percentage"], r["count"]), reverse=True)
    active = [r for r in rows if r["count"] > 0]
    step = person.get("third_step") or {}
    highlights: List[str] = []
    recommendations: List[str] = []
    priorities = [{"code": r["domain_code"], "name": r["domain_name"], "count": r["count"], "percentage": r["percentage"], "label": intensity_label(r["percentage"]), "heavy": r["heavy_problem_numbers"]} for r in active[:3]]
    if not active:
        highlights.append("Tidak ada nomor masalah yang dipilih pada seluruh bidang.")
        recommendations.append("Lakukan konfirmasi ulang pengisian AUM; pertimbangkan wawancara singkat untuk memastikan kondisi responden.")
    else:
        top = active[0]
        highlights.append(f"Bidang dominan: {top['domain_name']} ({top['domain_code']}) dengan {top['count']} masalah ({top['percentage']}% dari {top['item_count']} item) — {intensity_label(top['percentage'])}.")
        if len(active) > 1:
            highlights.append("Urutan prioritas: " + " → ".join(f"{r['domain_code']} {r['percentage']}%" for r in active[:5]) + ".")
        heavy_total = result["total_heavy_problems"]
        if heavy_total:
            heavy_desc = "; ".join(f"{r['domain_code']}: {', '.join(str(n).zfill(3) for n in r['heavy_problem_numbers'])}" for r in rows if r["heavy_problem_numbers"])
            highlights.append(f"{heavy_total} masalah dirasakan berat ({heavy_desc}).")
            recommendations.append(f"Konseling individual diprioritaskan untuk membahas masalah berat pada bidang {', '.join(r['domain_code'] for r in rows if r['heavy_problem_numbers'])}.")
        elif top["percentage"] >= 50:
            recommendations.append(f"Konseling individual disarankan karena bidang {top['domain_code']} mencapai {top['percentage']}%.")
        group_targets = [r["domain_code"] for r in active if 25 <= r["percentage"] < 50]
        if group_targets:
            recommendations.append(f"Bimbingan kelompok bertema {', '.join(group_targets)} bersama siswa lain yang memiliki pola serupa.")
        watch = [r["domain_code"] for r in active if 0 < r["percentage"] < 25]
        if watch:
            recommendations.append(f"Layanan informasi/klasikal dan pemantauan untuk bidang {', '.join(watch)}.")
    if str(step.get("want_discussion", "")).lower() == "ya":
        recommendations.append(f"Responden menyatakan ingin membicarakan masalah kepada {step.get('discussion_with') or 'Guru BK'} — jadwalkan tindak lanjut melalui Papan Konseling.")
    if str(step.get("complete", "")).lower() == "tidak":
        highlights.append("Responden menyatakan daftar masalah belum menggambarkan keseluruhan; ada masalah lain yang perlu digali.")
    if step.get("other_problems"):
        highlights.append(f"Masalah lain yang dituliskan: \"{step['other_problems']}\".")
    return {"scope": "individual", "summary": highlights[0] if highlights else "", "highlights": highlights, "priorities": priorities, "recommendations": recommendations, "rules": ANALYSIS_RULES}


def analyze_group(group: Dict[str, Any], people: List[Dict[str, Any]], class_name: str) -> Dict[str, Any]:
    rows = sorted(group["rows"], key=lambda r: (r["percentage"], r["total"]), reverse=True)
    active = [r for r in rows if r["total"] > 0]
    n = group["respondent_count"]
    highlights: List[str] = []
    recommendations: List[str] = []
    priorities = [{"code": r["domain_code"], "name": r["domain_name"], "count": r["total"], "percentage": r["percentage"], "average": r["average"], "label": group_label(r["percentage"]), "heavy": r["heavy_total"]} for r in active[:3]]
    if not active:
        highlights.append("Belum ada masalah yang terungkap pada kelompok ini.")
    else:
        top = active[0]
        highlights.append(f"Bidang dominan kelompok {class_name}: {top['domain_name']} ({top['domain_code']}) — {top['total']} masalah, rata-rata {top['average']} per siswa ({top['percentage']}%).")
        highlights.append(f"Rata-rata {group['average_problems']} masalah per siswa dan {group['average_heavy_problems']} masalah berat per siswa dari {n} responden.")
        spread = [r for r in active if r["highest"] - r["lowest"] >= 5]
        if spread:
            highlights.append("Sebaran lebar (perbedaan siswa besar) pada bidang " + ", ".join(f"{r['domain_code']} ({r['lowest']}–{r['highest']})" for r in spread[:4]) + ".")
        klasikal = [r["domain_code"] for r in active if r["percentage"] >= 25]
        kelompok = [r["domain_code"] for r in active if 10 <= r["percentage"] < 25]
        if klasikal:
            recommendations.append(f"Layanan klasikal untuk seluruh kelas bertema {', '.join(klasikal)} karena masalah dirasakan mayoritas siswa.")
        if kelompok:
            recommendations.append(f"Bimbingan kelompok bagi siswa yang memilih masalah pada bidang {', '.join(kelompok)}.")
        heavy_people = sorted([p for p in people if p.get("heavy_problem_numbers")], key=lambda p: (len(p.get("heavy_problem_numbers", [])), len(p.get("selected_problem_numbers", []))), reverse=True)[:5]
        if heavy_people:
            recommendations.append("Kandidat konseling individual (masalah berat terbanyak): " + ", ".join(f"{p['name']} ({len(p.get('heavy_problem_numbers', []))} berat)" for p in heavy_people) + ".")
    consult = group.get("consultation") or consult_counts(people)
    wanting = sum(consult.values())
    if wanting:
        highlights.append(f"{wanting} siswa ingin mengkonsultasikan masalah (" + ", ".join(f"{k} {v}" for k, v in consult.items() if v) + ").")
        recommendations.append("Tindak lanjuti permintaan konsultasi melalui Papan Konseling dan koordinasikan dengan pihak yang diminta siswa.")
    return {"scope": "group", "summary": highlights[0] if highlights else "", "highlights": highlights, "priorities": priorities, "recommendations": recommendations, "rules": ANALYSIS_RULES}


def analyze_school(rekap: Dict[str, Any]) -> Dict[str, Any]:
    rows = rekap["domain_rows"]
    n = rekap["respondent_count"]
    highlights: List[str] = []
    recommendations: List[str] = []
    priorities = [{"code": r["code"], "name": r["name"], "count": r["total"], "percentage": round(r["total"] / n, 2) if n else 0, "label": "rata-rata per siswa", "heavy": r["heavy"]} for r in rows[:3]]
    if not rows or not n:
        highlights.append("Belum ada data responden pada sekolah ini.")
    else:
        top = rows[0]
        highlights.append(f"Bidang dominan sekolah {rekap['school']['name']}: {top['name']} ({top['code']}) — {top['total']} masalah dari {n} responden ({top['heavy']} berat).")
        highlights.append("Urutan bidang: " + " → ".join(f"{r['code']} {r['total']}" for r in rows[:5]) + ".")
        classes = sorted([c for c in rekap["class_summary"] if c["respondent_count"]], key=lambda c: c["average_problems"], reverse=True)
        if classes:
            highlights.append(f"Kelas dengan rata-rata masalah tertinggi: {classes[0]['name']} ({classes[0]['average_problems']} per siswa); terendah: {classes[-1]['name']} ({classes[-1]['average_problems']}).")
            recommendations.append(f"Prioritaskan program layanan di kelas {classes[0]['name']} dan susun layanan klasikal lintas kelas bertema {top['code']}.")
        heavy_rows = [r for r in rows if r["heavy"]]
        if heavy_rows:
            recommendations.append("Siapkan jadwal konseling individual untuk masalah berat terbanyak pada bidang " + ", ".join(r["code"] for r in heavy_rows[:3]) + ".")
        recommendations.append("Gunakan tab Tren untuk membandingkan profil ini dengan tahun ajaran sebelumnya.")
    return {"scope": "school", "summary": highlights[0] if highlights else "", "highlights": highlights, "priorities": priorities, "recommendations": recommendations, "rules": ANALYSIS_RULES}


async def build_analysis(scope: str, identifier: str, user: CurrentUser) -> Dict[str, Any]:
    if scope == "individual":
        person = await db.respondents.find_one({"id": identifier, "owner_id": user.user_id}, {"_id": 0})
        if not person:
            raise HTTPException(404, "Responden tidak ditemukan.")
        result = score_individual(person["format_id"], person.get("selected_problem_numbers", []), person.get("heavy_problem_numbers", []))
        analysis = analyze_individual(person, result)
        analysis["title"] = f"{person['name']} · {person.get('class_name') or ''}"
        return analysis
    if scope == "group":
        cls = await db.classes.find_one({"id": identifier, "owner_id": user.user_id}, {"_id": 0})
        people = await db.respondents.find({"class_id": identifier, "owner_id": user.user_id}, {"_id": 0}).to_list(1000)
        if not people:
            raise HTTPException(404, "Belum ada responden pada kelompok ini.")
        group = await scoring_group(GroupInput(format_id=people[0]["format_id"], class_id=identifier), user)
        analysis = analyze_group(group, people, (cls or {}).get("name") or people[0].get("class_name", ""))
        analysis["title"] = f"Kelas {(cls or {}).get('name') or ''}"
        return analysis
    if scope == "school":
        rekap = await rekap_school(identifier, user)
        analysis = analyze_school(rekap)
        analysis["title"] = rekap["school"]["name"]
        return analysis
    raise HTTPException(400, "Jenis analisis tidak dikenal.")


@api_router.get("/analysis/{scope}/{identifier}")
async def analysis_endpoint(scope: str, identifier: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    analysis = await build_analysis(scope, identifier, user)
    cached = await db.ai_analyses.find_one({"owner_id": user.user_id, "scope": scope, "identifier": identifier}, {"_id": 0})
    analysis["ai_narrative"] = cached["narrative"] if cached and cached.get("data_hash") == analysis_hash(analysis) else ""
    return analysis


def analysis_hash(analysis: Dict[str, Any]) -> str:
    import hashlib
    import json
    return hashlib.sha1(json.dumps({"h": analysis["highlights"], "p": analysis["priorities"]}, sort_keys=True, default=str).encode()).hexdigest()


@api_router.post("/analysis/{scope}/{identifier}/ai")
async def analysis_ai(scope: str, identifier: str, user: CurrentUser = Depends(current_user)) -> Dict[str, Any]:
    analysis = await build_analysis(scope, identifier, user)
    data_hash = analysis_hash(analysis)
    cached = await db.ai_analyses.find_one({"owner_id": user.user_id, "scope": scope, "identifier": identifier, "data_hash": data_hash}, {"_id": 0})
    if cached:
        return {"narrative": cached["narrative"], "cached": True}
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(503, "Kunci AI belum dikonfigurasi.")
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    system_message = (
        "Anda asisten Guru BK di Indonesia. Tulis narasi interpretasi hasil AUM Umum secara deskriptif, hangat, dan profesional dalam Bahasa Indonesia. "
        "DILARANG membuat diagnosis psikologis, label gangguan, atau kategori klinis. Fokus pada pola kebutuhan layanan dan saran tindak lanjut BK "
        "(layanan klasikal, bimbingan kelompok, konseling individual, kolaborasi orang tua/guru). Maksimal 170 kata: 1 paragraf interpretasi lalu 3 poin rekomendasi diawali tanda '-'. "
        "Gunakan hanya data yang diberikan; jangan mengarang angka."
    )
    prompt = f"Judul: {analysis.get('title', '')}\nTemuan deterministik:\n- " + "\n- ".join(analysis["highlights"]) + "\nPrioritas bidang: " + "; ".join(f"{p['code']} ({p['name']}) {p['percentage']}% {p['label']}" for p in analysis["priorities"]) + "\nRekomendasi aturan:\n- " + "\n- ".join(analysis["recommendations"] or ["-"])
    try:
        chat = LlmChat(api_key=api_key, session_id=f"aum-{user.user_id}-{scope}-{identifier}-{data_hash[:8]}", system_message=system_message).with_model("openai", "gpt-5.4")
        narrative = await chat.send_message(UserMessage(text=prompt))
    except Exception as error:
        logger.warning("AI analysis failed: %s", error)
        raise HTTPException(502, "Narasi AI belum dapat dibuat saat ini. Analisis deterministik tetap tersedia.") from error
    narrative = str(narrative).strip()
    await db.ai_analyses.update_one({"owner_id": user.user_id, "scope": scope, "identifier": identifier}, {"$set": {"narrative": narrative, "data_hash": data_hash, "model": "gpt-5.4", "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    await db.audit_logs.insert_one({"id": uid("audit"), "owner_id": user.user_id, "action": "ai_analysis", "details": {"formula": f"Narasi AI ({scope}) dibuat dari temuan deterministik; tidak mengubah skor"}, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"narrative": narrative, "cached": False}


async def cached_narrative(scope: str, identifier: str, user: CurrentUser) -> str:
    cached = await db.ai_analyses.find_one({"owner_id": user.user_id, "scope": scope, "identifier": identifier}, {"_id": 0, "narrative": 1})
    return (cached or {}).get("narrative", "")


def analysis_lines(analysis: Dict[str, Any], ai_narrative: str = "") -> List[str]:
    lines = ["", "ANALISIS & REKOMENDASI (deterministik, bukan diagnosis)"]
    lines += [f"• {h}" for h in analysis["highlights"]]
    lines += ["Rekomendasi layanan:"] + [f"  - {r}" for r in analysis["recommendations"]]
    if ai_narrative:
        lines += ["", "Narasi AI (pendukung):"]
        import textwrap
        for paragraph in ai_narrative.splitlines():
            lines += textwrap.wrap(paragraph, 110) or [""]
    return lines


def consult_counts(people: List[Dict[str, Any]]) -> Dict[str, int]:
    counts = {target: 0 for target in CONSULT_TARGETS}
    for person in people:
        step = person.get("third_step") or {}
        if str(step.get("want_discussion", "")).lower() != "ya":
            continue
        target = "".join(str(step.get("discussion_with", "")).lower().split())
        matched = next((label for label in CONSULT_TARGETS[:-1] if target and ("".join(label.lower().split()) in target or target in "".join(label.lower().split()))), "Lain-lain")
        counts[matched] += 1
    return counts


def official_pdf(title: str, subtitle: str, header_fields: List[tuple], columns: List[tuple], rows: List[List[Any]], footer: List[str], filename: str) -> Response:
    """PDF mengikuti Tabel 7/8 pedoman AUM: kepala surat RAHASIA, identitas, tabel bidang, dan blok konsultasi."""
    buffer = io.BytesIO()
    document = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    document.setTitle(title)
    margin = 40
    document.setFont("Helvetica-Bold", 9)
    document.rect(width - margin - 62, height - 48, 62, 18)
    document.drawCentredString(width - margin - 31, height - 43, "RAHASIA")
    document.setFont("Helvetica-Bold", 13)
    document.drawCentredString(width / 2, height - 60, title)
    document.setFont("Helvetica", 10)
    document.drawCentredString(width / 2, height - 75, subtitle)
    y = height - 100
    document.setFont("Helvetica", 9)
    for label, value in header_fields:
        document.drawString(margin, y, f"{label}")
        document.drawString(margin + 130, y, f": {value}")
        y -= 14
    y -= 8
    total_width = width - 2 * margin
    col_widths = [total_width * share for _, share in columns]
    row_height = 18

    def draw_header(top: float) -> float:
        document.setFont("Helvetica-Bold", 7)
        x = margin
        for (label, _), col_width in zip(columns, col_widths):
            document.rect(x, top - row_height, col_width, row_height)
            document.drawCentredString(x + col_width / 2, top - 12, label)
            x += col_width
        return top - row_height

    y = draw_header(y)
    document.setFont("Helvetica", 8)
    for row in rows:
        if y - row_height < 90:
            document.showPage()
            y = height - 60
            y = draw_header(y)
            document.setFont("Helvetica", 8)
        x = margin
        is_total = str(row[0]).lower().startswith("keseluruhan")
        document.setFont("Helvetica-Bold" if is_total else "Helvetica", 8)
        for index, (value, col_width) in enumerate(zip(row, col_widths)):
            document.rect(x, y - row_height, col_width, row_height)
            text = str(value)
            max_chars = max(int(col_width / 4.2), 4)
            if len(text) > max_chars:
                text = text[: max_chars - 1] + "…"
            if index == 0:
                document.drawString(x + 4, y - 12, text)
            else:
                document.drawCentredString(x + col_width / 2, y - 12, text)
            x += col_width
        y -= row_height
    y -= 18
    document.setFont("Helvetica", 9)
    import textwrap
    for raw_line in footer:
        for line in (textwrap.wrap(raw_line, 105, subsequent_indent="   ") or [""]):
            if y < 60:
                document.showPage()
                y = height - 60
            document.drawString(margin, y, line)
            y -= 14
    document.drawString(width - margin - 200, max(y - 10, 40), f"Pengolah Data, {datetime.now().strftime('%d-%m-%Y')}")
    document.save()
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


@api_router.get("/export/{scope}/{identifier}")
async def export_result(scope: str, identifier: str, file_format: str = Query("xlsx", alias="format"), user: CurrentUser = Depends(current_user)) -> Response:
    if scope == "individual":
        person = await db.respondents.find_one({"id": identifier, "owner_id": user.user_id}, {"_id": 0})
        if not person:
            raise HTTPException(404, "Responden tidak ditemukan.")
        result = score_individual(person["format_id"], person.get("selected_problem_numbers", []), person.get("heavy_problem_numbers", []))
        config = FORMATS[person["format_id"]]
        rows = [{"bidang": row["domain_code"], "nama_bidang": row["domain_name"], "nomor_masalah": ", ".join(str(number).zfill(3) for number in row["problem_numbers"]), "JML": row["count"], "persentase": row["percentage"], "masalah_berat": ", ".join(str(number).zfill(3) for number in row["heavy_problem_numbers"])} for row in result["rows"]]
        if file_format.lower() == "pdf":
            step = person.get("third_step") or {}
            table = [[f"{i}. {row['nama_bidang']} — {row['bidang']}", row["nomor_masalah"] or "-", row["JML"], f"{row['persentase']}%", row["masalah_berat"] or "-"] for i, row in enumerate(rows, start=1)]
            table.append(["Keseluruhan", f"{result['total_problems']} nomor", result["total_problems"], f"{result['overall_percentage']}%", result["total_heavy_problems"]])
            return official_pdf(
                "TABEL 7 : HASIL PENGOLAHAN AUM", f"SERI UMUM FORMAT {config['code'][-1]} ({config['target']}) — INDIVIDUAL",
                [("Nama", person["name"]), ("NIS/NIM/NIP/NIK", person.get("respondent_id") or "-"), ("Jenis Kelamin", "Laki-laki" if person.get("gender") == "L" else "Perempuan" if person.get("gender") == "P" else "-"), ("Kelas/Sekolah", f"{person.get('class_name') or '-'} / {person.get('institution') or '-'}"), ("Tahun Ajaran", person.get("academic_year") or "-"), ("Tanggal", person.get("filled_date") or "-"), ("Pengolah AUM", user.name)],
                [("BIDANG MASALAH", 0.34), ("NOMOR MASALAH", 0.34), ("JML", 0.08), ("%", 0.09), ("NO. MASALAH BERAT", 0.15)],
                table,
                [f"Ingin mengkonsultasikan masalah kepada : {step.get('discussion_with') or '-' if str(step.get('want_discussion', '')).lower() == 'ya' else 'Tidak'}", f"Masalah lain yang belum tercantum : {step.get('other_problems') or '-'}", "Catatan: hasil bersifat deskriptif dan rahasia; bukan diagnosis psikologis."] + analysis_lines(analyze_individual(person, result), await cached_narrative("individual", identifier, user)),
                "hasil-aum-individual.pdf",
            )
        return xlsx_response(rows, "hasil-aum-individual.xlsx")
    if scope == "group":
        people = await db.respondents.find({"class_id": identifier, "owner_id": user.user_id}, {"_id": 0}).to_list(1000)
        if not people:
            raise HTTPException(404, "Belum ada responden pada kelompok ini.")
        group = await scoring_group(GroupInput(format_id=people[0]["format_id"], class_id=identifier), user)
        rows = [{"bidang": row["domain_code"], "nama_bidang": row["domain_name"], "terendah": row["lowest"], "tertinggi": row["highest"], "JML": row["total"], "persentase": row["percentage"], "rata_rata": row["average"], "JML_berat": row["heavy_total"], "rata_rata_berat": row["heavy_average"]} for row in group["rows"]]
        if file_format.lower() == "pdf":
            cls = await db.classes.find_one({"id": identifier, "owner_id": user.user_id}, {"_id": 0}) or {}
            config = FORMATS[people[0]["format_id"]]
            counts = consult_counts(people)
            table = [[f"{i}. {row['nama_bidang']} — {row['bidang']}", row["terendah"], row["tertinggi"], row["JML"], f"{row['persentase']}%", row["rata_rata"], row["JML_berat"], row["rata_rata_berat"]] for i, row in enumerate(rows, start=1)]
            table.append(["Keseluruhan", min(len(p.get("selected_problem_numbers", [])) for p in people), max(len(p.get("selected_problem_numbers", [])) for p in people), group["total_problems"], f"{round(group['total_problems'] / config['total_items'] / len(people) * 100, 2)}%", group["average_problems"], group["total_heavy_problems"], group["average_heavy_problems"]])
            return official_pdf(
                "TABEL 8 : HASIL PENGOLAHAN AUM", f"SERI UMUM FORMAT {config['code'][-1]} ({config['target']}) — KELOMPOK",
                [("Nama Sekolah/Kelompok", people[0].get("institution") or "-"), ("Kelas/Kelompok", cls.get("name") or people[0].get("class_name") or "-"), ("Jumlah Anggota", f"{group['respondent_count']} orang"), ("Tahun Ajaran", people[0].get("academic_year") or "-"), ("Tanggal Pengadm. AUM", max((p.get("filled_date") or "" for p in people), default="-") or "-"), ("Pengolah AUM", user.name)],
                [("BIDANG MASALAH", 0.30), ("TERENDAH", 0.09), ("TERTINGGI", 0.09), ("JML", 0.09), ("%", 0.10), ("RATA² / SISWA", 0.11), ("JML BERAT", 0.10), ("RATA² BERAT", 0.12)],
                table,
                ["Ingin mengkonsultasikan masalah kepada :"] + [f"   {label:<12}: {counts[label]} orang" for label in CONSULT_TARGETS] + ["Catatan: hasil bersifat deskriptif dan rahasia; bukan diagnosis psikologis."] + analysis_lines(analyze_group(group, people, cls.get("name") or people[0].get("class_name", "")), await cached_narrative("group", identifier, user)),
                "hasil-aum-kelompok.pdf",
            )
        return xlsx_response(rows, "hasil-aum-kelompok.xlsx")
    raise HTTPException(400, "Jenis export tidak dikenal.")


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()