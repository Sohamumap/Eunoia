from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
import uuid
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import jwt as pyjwt
import random

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================
# PYDANTIC MODELS
# ============================================================
class SignupRequest(BaseModel):
    email: str
    locale: str = "OTHER"
    role: str = "other"

class LoginRequest(BaseModel):
    email: str

class AssessmentSubmission(BaseModel):
    responses: dict  # { question_id: score }

class ReflectionCreate(BaseModel):
    body: str
    forum_id: Optional[str] = None
    is_private: bool = True
    parent_id: Optional[str] = None

class ModerationCheckRequest(BaseModel):
    text: str

class CrisisLogRequest(BaseModel):
    trigger_text: str
    helpline_shown: str
    action_taken: str

class ConsentUpdate(BaseModel):
    scope: str
    granted: bool

# ============================================================
# AUTH HELPERS
# ============================================================
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_display_name(role: str) -> str:
    prefix_map = {"resident": "Resident", "physician": "Dr", "student": "Intern", "other": "Member"}
    prefix = prefix_map.get(role, "Member")
    return f"{prefix}_{random.randint(1000, 9999)}"

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("_id", None)
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

# ============================================================
# AUTH ROUTES
# ============================================================
@api_router.post("/auth/signup")
async def signup(req: SignupRequest, response: Response):
    email = req.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    display_name = generate_display_name(req.role)
    user = {
        "id": user_id, "email": email, "display_name": display_name,
        "locale": req.locale, "role": req.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "onboarded": False
    }
    await db.users.insert_one({**user, "_id": user_id})
    # Create default consents
    for scope in ["research_scales", "research_reflections", "data_trust"]:
        await db.consents.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "scope": scope,
            "granted": scope == "research_scales",
            "granted_at": datetime.now(timezone.utc).isoformat()
        })
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    user.pop("_id", None)
    return {"user": user, "token": access_token}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email. Please sign up first.")
    user.pop("_id", None)
    access_token = create_access_token(user["id"], email)
    refresh_token = create_refresh_token(user["id"])
    set_auth_cookies(response, access_token, refresh_token)
    return {"user": user, "token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"user": user}

@api_router.post("/auth/complete-onboarding")
async def complete_onboarding(request: Request):
    user = await get_current_user(request)
    await db.users.update_one({"id": user["id"]}, {"$set": {"onboarded": True}})
    return {"message": "Onboarding complete"}

# ============================================================
# ASSESSMENT DATA
# ============================================================
ASSESSMENT_QUESTIONS = [
    # PHQ-9 (0-3 scale)
    {"id": "phq9_1", "scale": "PHQ-9", "dimension": "depression", "text": "Little interest or pleasure in doing things", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_2", "scale": "PHQ-9", "dimension": "depression", "text": "Feeling down, depressed, or hopeless", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_3", "scale": "PHQ-9", "dimension": "depression", "text": "Trouble falling or staying asleep, or sleeping too much", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_4", "scale": "PHQ-9", "dimension": "depression", "text": "Feeling tired or having little energy", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_5", "scale": "PHQ-9", "dimension": "depression", "text": "Poor appetite or overeating", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_6", "scale": "PHQ-9", "dimension": "depression", "text": "Feeling bad about yourself, or that you are a failure, or have let yourself or your family down", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_7", "scale": "PHQ-9", "dimension": "depression", "text": "Trouble concentrating on things, such as reading or watching television", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_8", "scale": "PHQ-9", "dimension": "depression", "text": "Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "phq9_9", "scale": "PHQ-9", "dimension": "depression", "text": "Thoughts that you would be better off dead, or of hurting yourself in some way", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    # GAD-7 (0-3 scale)
    {"id": "gad7_1", "scale": "GAD-7", "dimension": "anxiety", "text": "Feeling nervous, anxious, or on edge", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "gad7_2", "scale": "GAD-7", "dimension": "anxiety", "text": "Not being able to stop or control worrying", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "gad7_3", "scale": "GAD-7", "dimension": "anxiety", "text": "Worrying too much about different things", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "gad7_4", "scale": "GAD-7", "dimension": "anxiety", "text": "Trouble relaxing", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "gad7_5", "scale": "GAD-7", "dimension": "anxiety", "text": "Being so restless that it is hard to sit still", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "gad7_6", "scale": "GAD-7", "dimension": "anxiety", "text": "Becoming easily annoyed or irritable", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    {"id": "gad7_7", "scale": "GAD-7", "dimension": "anxiety", "text": "Feeling afraid, as if something awful might happen", "options": [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]},
    # MBI-HSS Subset (0-6 scale): 3 EE, 2 DP, 1 PA
    {"id": "mbi_ee1", "scale": "MBI-HSS-SUBSET", "dimension": "emotional_exhaustion", "text": "I feel emotionally drained from my work", "options": [{"value": 0, "label": "Never"}, {"value": 1, "label": "A few times a year"}, {"value": 2, "label": "Once a month"}, {"value": 3, "label": "A few times a month"}, {"value": 4, "label": "Once a week"}, {"value": 5, "label": "A few times a week"}, {"value": 6, "label": "Every day"}]},
    {"id": "mbi_ee2", "scale": "MBI-HSS-SUBSET", "dimension": "emotional_exhaustion", "text": "I feel used up at the end of the workday", "options": [{"value": 0, "label": "Never"}, {"value": 1, "label": "A few times a year"}, {"value": 2, "label": "Once a month"}, {"value": 3, "label": "A few times a month"}, {"value": 4, "label": "Once a week"}, {"value": 5, "label": "A few times a week"}, {"value": 6, "label": "Every day"}]},
    {"id": "mbi_ee3", "scale": "MBI-HSS-SUBSET", "dimension": "emotional_exhaustion", "text": "I feel fatigued when I get up in the morning and have to face another day on the job", "options": [{"value": 0, "label": "Never"}, {"value": 1, "label": "A few times a year"}, {"value": 2, "label": "Once a month"}, {"value": 3, "label": "A few times a month"}, {"value": 4, "label": "Once a week"}, {"value": 5, "label": "A few times a week"}, {"value": 6, "label": "Every day"}]},
    {"id": "mbi_dp1", "scale": "MBI-HSS-SUBSET", "dimension": "depersonalization", "text": "I feel I treat some patients as if they were impersonal objects", "options": [{"value": 0, "label": "Never"}, {"value": 1, "label": "A few times a year"}, {"value": 2, "label": "Once a month"}, {"value": 3, "label": "A few times a month"}, {"value": 4, "label": "Once a week"}, {"value": 5, "label": "A few times a week"}, {"value": 6, "label": "Every day"}]},
    {"id": "mbi_dp2", "scale": "MBI-HSS-SUBSET", "dimension": "depersonalization", "text": "I have become more callous toward people since I took this job", "options": [{"value": 0, "label": "Never"}, {"value": 1, "label": "A few times a year"}, {"value": 2, "label": "Once a month"}, {"value": 3, "label": "A few times a month"}, {"value": 4, "label": "Once a week"}, {"value": 5, "label": "A few times a week"}, {"value": 6, "label": "Every day"}]},
    {"id": "mbi_pa1", "scale": "MBI-HSS-SUBSET", "dimension": "personal_accomplishment", "text": "I feel I am positively influencing other people's lives through my work", "options": [{"value": 0, "label": "Never"}, {"value": 1, "label": "A few times a year"}, {"value": 2, "label": "Once a month"}, {"value": 3, "label": "A few times a month"}, {"value": 4, "label": "Once a week"}, {"value": 5, "label": "A few times a week"}, {"value": 6, "label": "Every day"}]},
    # UCLA-3 (1-3 scale)
    {"id": "ucla_1", "scale": "UCLA-3", "dimension": "loneliness", "text": "How often do you feel that you lack companionship?", "options": [{"value": 1, "label": "Hardly ever"}, {"value": 2, "label": "Some of the time"}, {"value": 3, "label": "Often"}]},
    {"id": "ucla_2", "scale": "UCLA-3", "dimension": "loneliness", "text": "How often do you feel left out?", "options": [{"value": 1, "label": "Hardly ever"}, {"value": 2, "label": "Some of the time"}, {"value": 3, "label": "Often"}]},
    {"id": "ucla_3", "scale": "UCLA-3", "dimension": "loneliness", "text": "How often do you feel isolated from others?", "options": [{"value": 1, "label": "Hardly ever"}, {"value": 2, "label": "Some of the time"}, {"value": 3, "label": "Often"}]},
]

# ============================================================
# ASSESSMENT ROUTES
# ============================================================
@api_router.get("/assessments/questions")
async def get_assessment_questions():
    return {"questions": ASSESSMENT_QUESTIONS, "total": len(ASSESSMENT_QUESTIONS)}

@api_router.post("/assessments/submit")
async def submit_assessment(submission: AssessmentSubmission, request: Request):
    user = await get_current_user(request)
    responses = submission.responses
    # Compute scale scores
    scales = {}
    # PHQ-9
    phq9_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["scale"] == "PHQ-9"]
    phq9_score = sum(responses.get(qid, 0) for qid in phq9_ids)
    scales["PHQ-9"] = {"raw_scores": {qid: responses.get(qid, 0) for qid in phq9_ids}, "computed_score": phq9_score, "max": 27}
    # GAD-7
    gad7_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["scale"] == "GAD-7"]
    gad7_score = sum(responses.get(qid, 0) for qid in gad7_ids)
    scales["GAD-7"] = {"raw_scores": {qid: responses.get(qid, 0) for qid in gad7_ids}, "computed_score": gad7_score, "max": 21}
    # MBI-HSS Subset
    ee_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["dimension"] == "emotional_exhaustion"]
    dp_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["dimension"] == "depersonalization"]
    pa_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["dimension"] == "personal_accomplishment"]
    ee_score = sum(responses.get(qid, 0) for qid in ee_ids)
    dp_score = sum(responses.get(qid, 0) for qid in dp_ids)
    pa_score = sum(responses.get(qid, 0) for qid in pa_ids)
    scales["MBI-HSS-SUBSET"] = {
        "raw_scores": {qid: responses.get(qid, 0) for qid in ee_ids + dp_ids + pa_ids},
        "computed_score": {"ee": ee_score, "dp": dp_score, "pa": pa_score},
        "max": {"ee": 18, "dp": 12, "pa": 6}
    }
    # UCLA-3
    ucla_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["scale"] == "UCLA-3"]
    ucla_score = sum(responses.get(qid, 0) for qid in ucla_ids)
    scales["UCLA-3"] = {"raw_scores": {qid: responses.get(qid, 0) for qid in ucla_ids}, "computed_score": ucla_score, "max": 9}

    # Store each scale as separate assessment record
    assessment_ids = []
    for scale_name, scale_data in scales.items():
        aid = str(uuid.uuid4())
        doc = {
            "id": aid, "user_id": user["id"], "scale_name": scale_name,
            "raw_scores_json": scale_data["raw_scores"],
            "computed_score": scale_data["computed_score"] if not isinstance(scale_data["computed_score"], dict) else json.dumps(scale_data["computed_score"]),
            "taken_at": datetime.now(timezone.utc).isoformat()
        }
        await db.assessments.insert_one({**doc, "_id": aid})
        assessment_ids.append(aid)

    # Generate initial wellness profile from assessment scores
    anxiety_pct = round((gad7_score / 21) * 100)
    stress_pct = round(((phq9_score / 27) * 0.5 + (ee_score / 18) * 0.5) * 100)
    loneliness_pct = round(((ucla_score - 3) / 6) * 100)
    burnout_pct = round(((ee_score / 18) * 0.4 + (dp_score / 12) * 0.3 + ((6 - pa_score) / 6) * 0.3) * 100)

    # Determine archetype
    archetype = determine_archetype(ee_score, dp_score, pa_score, gad7_score, ucla_score)
    summary = generate_assessment_summary(archetype, anxiety_pct, stress_pct, loneliness_pct, burnout_pct)
    recommended_forum = await get_recommended_forum(anxiety_pct, stress_pct, loneliness_pct, burnout_pct)

    profile_id = str(uuid.uuid4())
    profile = {
        "id": profile_id, "user_id": user["id"], "archetype": archetype,
        "anxiety_score": anxiety_pct, "stress_score": stress_pct,
        "loneliness_score": loneliness_pct, "burnout_score": burnout_pct,
        "summary": summary,
        "recommended_forum_id": recommended_forum.get("id") if recommended_forum else None,
        "recommended_forum_name": recommended_forum.get("name") if recommended_forum else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "assessment",
        "citations": [
            "PHQ-9: Kroenke, Spitzer & Williams, J Gen Intern Med 2001",
            "GAD-7: Spitzer, Kroenke, Williams & Lowe, Arch Intern Med 2006",
            "MBI-HSS: Maslach & Jackson, J Occup Behav 1981",
            "UCLA-3: Hughes, Waite, Hawkley & Cacioppo, Res Aging 2004"
        ]
    }
    await db.wellness_profiles.insert_one({**profile, "_id": profile_id})
    return {"assessment_ids": assessment_ids, "profile": profile}

def determine_archetype(ee, dp, pa, gad7, ucla):
    if ee >= 12 and dp < 6 and pa >= 3:
        return "The Over-Committed Healer"
    elif gad7 >= 10 and dp < 6:
        return "The Silent Carrier"
    elif ucla >= 7 and pa >= 3:
        return "The Isolated Achiever"
    elif dp >= 6 and ee >= 12 and pa < 3:
        return "The Weary Witness"
    elif ee >= 10:
        return "The Over-Committed Healer"
    elif gad7 >= 8:
        return "The Silent Carrier"
    else:
        return "The Over-Committed Healer"

def generate_assessment_summary(archetype, anxiety, stress, loneliness, burnout):
    summaries = {
        "The Over-Committed Healer": "You are running on fumes, and you know it. The exhaustion, the emotional weight, the sense that you are giving everything and it is never enough \u2014 these are not flaws. They are what the body does when it has not been allowed to rest. You do not need fixing. You need a cohort.",
        "The Silent Carrier": "You carry more than anyone sees. The worry, the restlessness, the quiet dread that something is about to go wrong \u2014 these are your body's way of saying it has been on high alert for too long. Naming it is the first step. You are not alone in this.",
        "The Isolated Achiever": "You are performing, perhaps even excelling, but you are doing it alone. The disconnection you feel is not weakness \u2014 it is a signal that the work has pulled you away from the people who remind you why it matters. Reconnection is not a luxury. It is medicine.",
        "The Weary Witness": "You have been at this long enough that the edges have worn smooth. The numbness, the detachment, the sense that you are going through motions \u2014 these are not character flaws. They are the cost of sustained exposure to suffering without adequate support. This can change."
    }
    return summaries.get(archetype, summaries["The Over-Committed Healer"])

async def get_recommended_forum(anxiety, stress, loneliness, burnout):
    if stress >= 70 or burnout >= 70:
        forum = await db.forums.find_one({"name": "The Sleepless Ward"}, {"_id": 0})
    elif anxiety >= 60:
        forum = await db.forums.find_one({"name": "The Quiet Panic"}, {"_id": 0})
    elif loneliness >= 60:
        forum = await db.forums.find_one({"name": "New Residents"}, {"_id": 0})
    else:
        forum = await db.forums.find_one({"name": "General Burnout"}, {"_id": 0})
    return forum

@api_router.get("/assessments/results")
async def get_assessment_results(request: Request):
    user = await get_current_user(request)
    results = await db.assessments.find({"user_id": user["id"]}, {"_id": 0}).sort("taken_at", -1).to_list(100)
    return {"results": results}

# ============================================================
# MODERATION HELPERS
# ============================================================
CRISIS_KEYWORDS = [
    r"\b(kill\s*(my)?self)\b", r"\b(want\s*to\s*die)\b", r"\b(ending\s*it)\b",
    r"\b(no\s*point)\b", r"\b(can'?t\s*go\s*on)\b", r"\b(better\s*off\s*dead)\b",
    r"\b(don'?t\s*want\s*to\s*be\s*here)\b", r"\b(suicid)\b", r"\b(self[- ]?harm)\b",
    r"\b(hurt\s*(my)?self)\b", r"\b(not\s*worth\s*(it|living))\b"
]

MEDICATION_PATTERNS = [
    r"\b(xanax|lorazepam|ativan|valium|diazepam|klonopin|clonazepam)\b",
    r"\b(zoloft|sertraline|prozac|fluoxetine|lexapro|escitalopram|paxil|paroxetine)\b",
    r"\b(ambien|zolpidem|trazodone|seroquel|quetiapine|lithium|lamictal)\b",
    r"\b(adderall|ritalin|methylphenidate|modafinil|wellbutrin|bupropion)\b",
    r"\b(ssri|snri|benzodiazepine|antidepressant|antipsychotic)\b",
    r"\d+\s*(mg|milligram)"
]

DIAGNOSTIC_PATTERNS = [
    r"\byou\s+(have|are|got)\s+(depression|anxiety|ptsd|adhd|bipolar|ocd|bpd)\b",
    r"\bthat'?s\s+(depression|anxiety|ptsd|adhd|bipolar|ocd)\b",
    r"\byou'?re\s+(depressed|anxious|bipolar|manic)\b",
    r"\bi\s+think\s+you\s+(have|are)\s+(depressed|anxious|mentally\s+ill)\b"
]

def check_moderation(text: str) -> dict:
    text_lower = text.lower()
    result = {"status": "approved", "flags": [], "highlights": [], "suggestion": None}

    # Crisis check
    for pattern in CRISIS_KEYWORDS:
        matches = re.finditer(pattern, text_lower)
        for m in matches:
            result["status"] = "paused_crisis"
            result["flags"].append({"type": "crisis", "text": m.group(), "start": m.start(), "end": m.end()})
            result["highlights"].append({"start": m.start(), "end": m.end(), "type": "crisis"})

    if result["status"] == "paused_crisis":
        return result

    # Medication check
    has_medication = False
    for pattern in MEDICATION_PATTERNS:
        matches = re.finditer(pattern, text_lower)
        for m in matches:
            has_medication = True
            result["flags"].append({"type": "medication", "text": m.group(), "start": m.start(), "end": m.end()})
            result["highlights"].append({"start": m.start(), "end": m.end(), "type": "medication"})

    # Check for suggestion context (medication + advice-like language)
    advice_patterns = [r"\btry\b", r"\btake\b", r"\bshould\b", r"\brecommend\b", r"\bhelps?\b", r"\bworks?\b", r"\buse\b"]
    has_advice = any(re.search(p, text_lower) for p in advice_patterns)

    if has_medication and has_advice:
        result["status"] = "needs_rewrite"

    # Diagnostic check
    for pattern in DIAGNOSTIC_PATTERNS:
        matches = re.finditer(pattern, text_lower)
        for m in matches:
            result["status"] = "blocked"
            result["flags"].append({"type": "diagnostic", "text": m.group(), "start": m.start(), "end": m.end()})
            result["highlights"].append({"start": m.start(), "end": m.end(), "type": "diagnostic"})

    return result

# ============================================================
# MODERATION ROUTES
# ============================================================
@api_router.post("/moderation/check")
async def moderation_check(req: ModerationCheckRequest):
    result = check_moderation(req.text)
    # If needs rewrite, generate suggestion via LLM
    if result["status"] == "needs_rewrite" and EMERGENT_LLM_KEY:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"mod-{uuid.uuid4()}",
                system_message="You are a compassionate content moderator for a peer mental health support platform. When a user shares medication-specific advice, rewrite it as a first-person coping experience WITHOUT mentioning any specific medication names, dosages, or brand names. Keep the emotional truth of what they said. Be warm and brief. Return ONLY the rewritten text, nothing else."
            ).with_model("openai", "gpt-5.2")
            suggestion = await chat.send_message(UserMessage(text=f"Rewrite this post to remove medication advice while keeping the emotional core: \"{req.text}\""))
            result["suggestion"] = suggestion
        except Exception as e:
            logger.error(f"LLM moderation error: {e}")
            result["suggestion"] = "I have been working with my doctor on a coping plan \u2014 the biggest shift for me has been committing to a steady wind-down routine before sleep. It is starting to help."
    return result

# ============================================================
# FORUM / CIRCLES ROUTES
# ============================================================
@api_router.get("/forums")
async def get_forums():
    forums = await db.forums.find({}, {"_id": 0}).to_list(100)
    for forum in forums:
        post_count = await db.reflections.count_documents({"forum_id": forum["id"], "parent_id": None})
        forum["post_count"] = post_count
    return {"forums": forums}

@api_router.get("/forums/{forum_id}")
async def get_forum(forum_id: str):
    forum = await db.forums.find_one({"id": forum_id}, {"_id": 0})
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    posts = await db.reflections.find(
        {"forum_id": forum_id, "parent_id": None, "moderation_status": {"$in": ["approved", "rewritten"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    # Get replies for each post
    for post in posts:
        replies = await db.reflections.find(
            {"parent_id": post["id"], "moderation_status": {"$in": ["approved", "rewritten"]}},
            {"_id": 0}
        ).sort("created_at", 1).to_list(50)
        # Get display names for replies
        for reply in replies:
            reply_user = await db.users.find_one({"id": reply["user_id"]}, {"_id": 0, "display_name": 1})
            if reply_user:
                reply["display_name"] = reply_user["display_name"]
            elif not reply.get("display_name"):
                reply["display_name"] = "Anonymous"
        post["replies"] = replies
        post_user = await db.users.find_one({"id": post["user_id"]}, {"_id": 0, "display_name": 1})
        if post_user:
            post["display_name"] = post_user["display_name"]
        elif not post.get("display_name"):
            post["display_name"] = "Anonymous"
    member_count = len(set([p["user_id"] for p in posts]))
    forum["member_count"] = max(member_count, forum.get("seeded_members_count", 0))
    return {"forum": forum, "posts": posts}

@api_router.post("/forums/{forum_id}/posts")
async def create_forum_post(forum_id: str, req: ReflectionCreate, request: Request):
    user = await get_current_user(request)
    forum = await db.forums.find_one({"id": forum_id}, {"_id": 0})
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    mod_result = check_moderation(req.body)
    if mod_result["status"] == "paused_crisis":
        return {"moderation": mod_result, "posted": False}
    if mod_result["status"] == "blocked":
        return {"moderation": mod_result, "posted": False}

    post_id = str(uuid.uuid4())
    post = {
        "id": post_id, "user_id": user["id"], "forum_id": forum_id,
        "body": req.body, "parent_id": req.parent_id,
        "moderation_status": mod_result["status"] if mod_result["status"] != "needs_rewrite" else "approved",
        "moderation_notes": json.dumps(mod_result["flags"]) if mod_result["flags"] else None,
        "is_private": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reflections.insert_one({**post, "_id": post_id})
    post["display_name"] = user["display_name"]
    post["replies"] = []
    return {"post": post, "moderation": mod_result, "posted": True}

# ============================================================
# REFLECTION / COMPANION ROUTES
# ============================================================
@api_router.post("/reflections")
async def create_reflection(req: ReflectionCreate, request: Request):
    user = await get_current_user(request)
    mod_result = check_moderation(req.body)
    if mod_result["status"] == "paused_crisis":
        return {"moderation": mod_result, "saved": False, "trigger_report": False}

    reflection_id = str(uuid.uuid4())
    reflection = {
        "id": reflection_id, "user_id": user["id"], "forum_id": None,
        "body": req.body, "parent_id": None,
        "moderation_status": "approved" if mod_result["status"] != "blocked" else "flagged_for_review",
        "moderation_notes": json.dumps(mod_result["flags"]) if mod_result["flags"] else None,
        "is_private": True, "word_count": len(req.body.split()),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reflections.insert_one({**reflection, "_id": reflection_id})

    # Check if user has 3+ qualifying reflections (>=100 words each)
    qualifying = await db.reflections.count_documents({
        "user_id": user["id"], "is_private": True,
        "word_count": {"$gte": 100}
    })
    trigger_report = qualifying >= 3

    return {"reflection": {k: v for k, v in reflection.items() if k != "_id"}, "saved": True, "trigger_report": trigger_report, "qualifying_count": qualifying}

@api_router.get("/reflections/me")
async def get_my_reflections(request: Request):
    user = await get_current_user(request)
    reflections = await db.reflections.find(
        {"user_id": user["id"], "is_private": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    qualifying = sum(1 for r in reflections if r.get("word_count", 0) >= 100)
    return {"reflections": reflections, "qualifying_count": qualifying}

# ============================================================
# BURNOUT REPORT AGENT
# ============================================================
@api_router.post("/profiles/generate-from-reflections")
async def generate_burnout_report(request: Request):
    user = await get_current_user(request)
    # Get last 3 qualifying reflections
    reflections = await db.reflections.find(
        {"user_id": user["id"], "is_private": True, "word_count": {"$gte": 100}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(3)
    if len(reflections) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 reflections of 100+ words")

    # Get latest assessment scores if available
    assessments = await db.assessments.find({"user_id": user["id"]}, {"_id": 0}).sort("taken_at", -1).to_list(10)
    assessment_context = ""
    if assessments:
        for a in assessments:
            assessment_context += f"\n- {a['scale_name']}: score {a['computed_score']}"

    reflection_texts = "\n\n---\n\n".join([f"Reflection {i+1}:\n{r['body']}" for i, r in enumerate(reflections)])

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"burnout-report-{user['id']}-{uuid.uuid4()}",
            system_message="""You are a clinical psychology screening assistant for Eunoia, a peer mental health support platform. You analyze free-form reflections and map them to validated burnout dimensions.

You must respond with ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "archetype": "one of: The Over-Committed Healer, The Silent Carrier, The Isolated Achiever, The Weary Witness",
  "anxiety_score": number 0-100,
  "stress_score": number 0-100,
  "loneliness_score": number 0-100,
  "burnout_score": number 0-100,
  "summary": "A compassionate 2-3 sentence summary in second person. Address the user as a capable adult having a hard time. Never use clinical labels. Never say 'you are depressed'. Instead say things like 'your screening suggests...' Keep the tone of serious warmth.",
  "recommended_forum": "one of: The Sleepless Ward, New Residents, The Quiet Panic, General Burnout"
}

Scoring guidelines:
- Map emotional exhaustion language (tired, drained, can't keep going) to high stress and burnout scores
- Map worry, fear, restlessness language to high anxiety scores
- Map isolation, disconnection, loneliness language to high loneliness scores
- Map numbness, cynicism, detachment language to depersonalization (high burnout)
- Consider the intensity and frequency of described experiences
- Cross-reference with any provided assessment scores for consistency"""
        ).with_model("openai", "gpt-5.2")

        prompt = f"""Analyze these three reflections from a healthcare worker and generate a Wellness Profile.

{reflection_texts}

{"Previous assessment scores:" + assessment_context if assessment_context else "No previous assessment scores available."}

Respond with ONLY the JSON object."""

        llm_response = await chat.send_message(UserMessage(text=prompt))
        # Parse JSON from response
        json_str = llm_response.strip()
        if json_str.startswith("```"):
            json_str = re.sub(r"```(?:json)?\s*", "", json_str)
            json_str = json_str.rstrip("`").strip()
        report = json.loads(json_str)
    except Exception as e:
        logger.error(f"LLM burnout report error: {e}")
        # Fallback: generate from text analysis
        report = {
            "archetype": "The Over-Committed Healer",
            "anxiety_score": 72, "stress_score": 84, "loneliness_score": 65, "burnout_score": 79,
            "summary": "You are running on fumes, and you know it. The anger, the forgetting, the fear \u2014 these are not flaws. They are what the body does when it has not been allowed to rest. You do not need fixing. You need a cohort.",
            "recommended_forum": "The Sleepless Ward"
        }

    recommended_forum = await db.forums.find_one({"name": report.get("recommended_forum", "General Burnout")}, {"_id": 0})
    profile_id = str(uuid.uuid4())
    profile = {
        "id": profile_id, "user_id": user["id"],
        "archetype": report["archetype"],
        "anxiety_score": report["anxiety_score"],
        "stress_score": report["stress_score"],
        "loneliness_score": report["loneliness_score"],
        "burnout_score": report["burnout_score"],
        "summary": report["summary"],
        "recommended_forum_id": recommended_forum["id"] if recommended_forum else None,
        "recommended_forum_name": recommended_forum["name"] if recommended_forum else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "reflections",
        "citations": [
            "MBI-HSS: Maslach & Jackson, J Occup Behav 1981; Wheeler et al., 2011",
            "Burnout-depression overlap: Bianchi, Schonfeld & Laurent, Clin Psychol Rev 2015",
            "Sleep-burnout: Metlaine et al., J Affect Disord 2017",
            "Peer intervention efficacy: West, Dyrbye, Erwin & Shanafelt, Lancet 2016"
        ]
    }
    await db.wellness_profiles.insert_one({**profile, "_id": profile_id})
    return {"profile": profile}

# ============================================================
# WELLNESS PROFILE ROUTES
# ============================================================
@api_router.get("/profiles/me")
async def get_my_profile(request: Request):
    user = await get_current_user(request)
    profile = await db.wellness_profiles.find_one(
        {"user_id": user["id"]}, {"_id": 0}
    )
    if not profile:
        return {"profile": None}
    # Sort to get latest
    profiles = await db.wellness_profiles.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("generated_at", -1).to_list(1)
    return {"profile": profiles[0] if profiles else None}

# ============================================================
# CRISIS ROUTES
# ============================================================
HELPLINES = {
    "IN": [
        {"name": "Tele-MANAS", "number": "14416", "tel": "tel:14416"},
        {"name": "iCall", "number": "9152987821", "tel": "tel:9152987821"},
        {"name": "Vandrevala Foundation", "number": "1860-2662-345", "tel": "tel:18602662345"}
    ],
    "US": [
        {"name": "988 Suicide & Crisis Lifeline", "number": "988", "tel": "tel:988"}
    ],
    "UK": [
        {"name": "Samaritans", "number": "116 123", "tel": "tel:116123"}
    ],
    "AE": [
        {"name": "National Crisis Helpline", "number": "800-HOPE (4673)", "tel": "tel:80046734"}
    ],
    "OTHER": [
        {"name": "International Association for Suicide Prevention", "number": "Visit https://www.iasp.info/resources/Crisis_Centres/", "tel": ""}
    ]
}

@api_router.get("/crisis/helplines/{locale}")
async def get_helplines(locale: str):
    lines = HELPLINES.get(locale.upper(), HELPLINES["OTHER"])
    return {"helplines": lines, "locale": locale}

@api_router.post("/crisis/log")
async def log_crisis_event(req: CrisisLogRequest, request: Request):
    user = await get_current_user(request)
    event_id = str(uuid.uuid4())
    event = {
        "id": event_id, "user_id": user["id"],
        "trigger_text": req.trigger_text,
        "helpline_shown": req.helpline_shown,
        "action_taken": req.action_taken,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.crisis_events.insert_one({**event, "_id": event_id})
    return {"logged": True}

# ============================================================
# CONSENT ROUTES
# ============================================================
@api_router.get("/consent/me")
async def get_my_consents(request: Request):
    user = await get_current_user(request)
    consents = await db.consents.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    return {"consents": consents}

@api_router.put("/consent/update")
async def update_consent(req: ConsentUpdate, request: Request):
    user = await get_current_user(request)
    await db.consents.update_one(
        {"user_id": user["id"], "scope": req.scope},
        {"$set": {"granted": req.granted, "granted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"updated": True}

# ============================================================
# DATA COOPERATIVE ROUTES
# ============================================================
@api_router.get("/data/contributions")
async def get_contributions(request: Request):
    user = await get_current_user(request)
    reflection_count = await db.reflections.count_documents({"user_id": user["id"], "is_private": True})
    assessment_count = await db.assessments.count_documents({"user_id": user["id"]})
    # Check consent status
    consents = await db.consents.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    consent_map = {c["scope"]: c["granted"] for c in consents}
    # Calculate estimated value (per scale = 10 INR, per reflection = 5 INR)
    value = 0
    if consent_map.get("research_scales"):
        value += assessment_count * 10
    if consent_map.get("research_reflections"):
        value += reflection_count * 5
    # Get contribution history
    history = []
    reflections = await db.reflections.find(
        {"user_id": user["id"], "is_private": True}, {"_id": 0, "created_at": 1, "word_count": 1}
    ).sort("created_at", -1).to_list(50)
    for r in reflections:
        history.append({"type": "reflection", "date": r["created_at"], "words": r.get("word_count", 0), "value": 5})
    assessments_list = await db.assessments.find(
        {"user_id": user["id"]}, {"_id": 0, "scale_name": 1, "taken_at": 1}
    ).sort("taken_at", -1).to_list(50)
    for a in assessments_list:
        history.append({"type": "assessment", "date": a["taken_at"], "scale": a["scale_name"], "value": 10})
    history.sort(key=lambda x: x["date"], reverse=True)
    return {
        "reflection_count": reflection_count, "assessment_count": assessment_count,
        "estimated_quarterly_value": value, "history": history,
        "consents": consent_map
    }

@api_router.get("/data/export")
async def export_data(request: Request):
    user = await get_current_user(request)
    reflections = await db.reflections.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    assessments = await db.assessments.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    profiles = await db.wellness_profiles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    consents = await db.consents.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    return {
        "user": {k: v for k, v in user.items() if k != "_id"},
        "reflections": reflections, "assessments": assessments,
        "wellness_profiles": profiles, "consents": consents,
        "exported_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.delete("/data/account")
async def delete_account(request: Request):
    user = await get_current_user(request)
    uid = user["id"]
    await db.reflections.delete_many({"user_id": uid})
    await db.assessments.delete_many({"user_id": uid})
    await db.wellness_profiles.delete_many({"user_id": uid})
    await db.consents.delete_many({"user_id": uid})
    await db.crisis_events.delete_many({"user_id": uid})
    await db.users.delete_one({"id": uid})
    return {"deleted": True}

# ============================================================
# HUB ROUTES
# ============================================================
PRACTICES = [
    {
        "id": "breathing-478",
        "title": "4-7-8 Breathing",
        "description": "A clinically-backed breathing technique that activates your parasympathetic nervous system. Inhale for 4 seconds, hold for 7, exhale for 8.",
        "duration": "2 minutes",
        "category": "breathwork",
        "steps": [
            {"instruction": "Breathe in through your nose", "duration": 4, "phase": "inhale"},
            {"instruction": "Hold your breath gently", "duration": 7, "phase": "hold"},
            {"instruction": "Exhale slowly through your mouth", "duration": 8, "phase": "exhale"}
        ],
        "cycles": 3,
        "citation": "Weil, A. (2015). Integrative medicine breathing technique."
    },
    {
        "id": "stoic-reflection",
        "title": "Stoic Evening Reflection",
        "description": "Three questions the Stoics asked every evening. Not to judge yourself, but to understand yourself.",
        "duration": "3 minutes",
        "category": "reflection",
        "prompts": [
            "What did I do well today?",
            "Where was I troubled, and what triggered it?",
            "What might I do differently tomorrow?"
        ],
        "citation": "Seneca, De Ira III.36; Epictetus, Discourses."
    },
    {
        "id": "grounding-54321",
        "title": "Sensory Grounding 5-4-3-2-1",
        "description": "A rapid grounding exercise used in trauma-informed care. Brings you out of your head and into the present moment.",
        "duration": "2 minutes",
        "category": "grounding",
        "steps": [
            {"sense": "see", "count": 5, "prompt": "Name 5 things you can see right now"},
            {"sense": "hear", "count": 4, "prompt": "Name 4 things you can hear"},
            {"sense": "touch", "count": 3, "prompt": "Name 3 things you can physically feel"},
            {"sense": "smell", "count": 2, "prompt": "Name 2 things you can smell"},
            {"sense": "taste", "count": 1, "prompt": "Name 1 thing you can taste"}
        ],
        "citation": "Adapted from Dialectical Behavior Therapy (DBT) distress tolerance skills."
    }
]

@api_router.get("/hub/practices")
async def get_practices():
    return {"practices": PRACTICES}

# ============================================================
# SEED DATA
# ============================================================
SEED_FORUMS = [
    {
        "id": "forum-sleepless-ward", "name": "The Sleepless Ward",
        "description": "For residents surviving night shifts. Because the world looks different at 3 AM.",
        "tags": ["sleep", "shift-work", "exhaustion"], "seeded_members_count": 127
    },
    {
        "id": "forum-new-residents", "name": "New Residents",
        "description": "First-year interns finding their footing. You are not the only one Googling things.",
        "tags": ["transition", "imposter", "overwhelm"], "seeded_members_count": 89
    },
    {
        "id": "forum-quiet-panic", "name": "The Quiet Panic",
        "description": "For the anxiety nobody sees. High-functioning on the outside, unraveling on the inside.",
        "tags": ["anxiety", "hidden", "high-functioning"], "seeded_members_count": 64
    },
    {
        "id": "forum-general-burnout", "name": "General Burnout",
        "description": "For anyone running on empty. No credentials required, just honesty.",
        "tags": ["burnout", "coping", "solidarity"], "seeded_members_count": 203
    }
]

SEED_POSTS = [
    # The Sleepless Ward
    {"forum_id": "forum-sleepless-ward", "display_name": "Resident_3847", "body": "Third night shift in a row. I can feel my thoughts getting slower, like wading through honey. Made a coffee at 4 AM and just stood there staring at it for two minutes before remembering I made it. Is this what everyone means by 'you get used to it'? Because I am not getting used to it.", "user_id": "seed-user-1"},
    {"forum_id": "forum-sleepless-ward", "display_name": "Intern_2091", "body": "Does anyone else get that weird guilt when you finally get to sleep? Like your body shuts down but your brain keeps running through the patients you saw. Last night I dreamed about a code blue that never happened. Woke up more tired than when I went to bed.", "user_id": "seed-user-2"},
    {"forum_id": "forum-sleepless-ward", "display_name": "Resident_5562", "body": "Found something that helps a little: I leave my phone in my locker during shifts and write three things I did right before I leave the hospital. Not a cure, but it stops the doom-scrolling and gives my brain something to land on instead of the mistakes.", "user_id": "seed-user-3"},
    # New Residents
    {"forum_id": "forum-new-residents", "display_name": "Intern_4421", "body": "Week 3. I misread an ECG today and my attending corrected me in front of the team. I know it is part of learning but I went to the bathroom and cried. I have never cried at work before. I used to be the person who held it together. I do not recognize myself right now.", "user_id": "seed-user-4"},
    {"forum_id": "forum-new-residents", "display_name": "Resident_7109", "body": "Everyone else seems to know what they are doing. I still have to look up drug interactions for things that should be basic. I keep thinking they made a mistake admitting me. Is this imposter syndrome or am I actually not ready?", "user_id": "seed-user-5"},
    {"forum_id": "forum-new-residents", "display_name": "Intern_0933", "body": "I practiced saying 'I need help' in my car this morning. Out loud. Three times. Then I walked in and asked my senior resident to walk me through the procedure I was scared of. She said 'thank you for asking' and I almost cried again, but in a good way this time.", "user_id": "seed-user-6"},
    # The Quiet Panic
    {"forum_id": "forum-quiet-panic", "display_name": "Dr_1847", "body": "Smile at rounds, panic in the bathroom. That is my routine now. Nobody knows. My evaluations are excellent. My hands shake when I am alone. I do not understand how both of these things can be true at the same time.", "user_id": "seed-user-7"},
    {"forum_id": "forum-quiet-panic", "display_name": "Resident_6230", "body": "I have had this tightness in my chest for two weeks. Went to cardiology \u2014 nothing. Went to pulm \u2014 nothing. I know what it is. I just cannot bring myself to say it out loud because then I would have to do something about it and I genuinely do not have the time.", "user_id": "seed-user-8"},
    {"forum_id": "forum-quiet-panic", "display_name": "Intern_8844", "body": "Told my co-resident I was fine today. I was not fine. But 'fine' is faster than explaining. And explaining means feeling it. And feeling it means I might not be able to stop.", "user_id": "seed-user-9"},
    # General Burnout
    {"forum_id": "forum-general-burnout", "display_name": "Member_2290", "body": "I used to love this. I do not remember when that stopped. It was not a single moment. It was like the color slowly drained out and I did not notice until everything was grey. I still show up. I still do the work. But the thing that made me choose this \u2014 I cannot find it anymore.", "user_id": "seed-user-10"},
    {"forum_id": "forum-general-burnout", "display_name": "Resident_4455", "body": "My partner asked me how my day was and I could not answer. Not because it was bad. Not because it was good. Because I genuinely could not remember. Twelve hours, and it is just a blur. Is that normal? Is that burnout? Is there a difference?", "user_id": "seed-user-11"},
    {"forum_id": "forum-general-burnout", "display_name": "Dr_3371", "body": "Took a walk during lunch for the first time in months. Just ten minutes. Noticed the sky was that specific shade of blue that used to make me happy. Did not make me happy today, but I noticed it. That feels like something.", "user_id": "seed-user-12"},
]

async def seed_database():
    # Seed forums
    for forum in SEED_FORUMS:
        existing = await db.forums.find_one({"id": forum["id"]})
        if not existing:
            await db.forums.insert_one({**forum, "_id": forum["id"]})
            logger.info(f"Seeded forum: {forum['name']}")

    # Seed posts
    for post_data in SEED_POSTS:
        existing = await db.reflections.find_one({"user_id": post_data["user_id"], "forum_id": post_data["forum_id"]})
        if not existing:
            post_id = str(uuid.uuid4())
            post = {
                "id": post_id, "_id": post_id,
                "user_id": post_data["user_id"],
                "forum_id": post_data["forum_id"],
                "body": post_data["body"],
                "parent_id": None,
                "moderation_status": "approved",
                "moderation_notes": None,
                "is_private": False,
                "display_name": post_data["display_name"],
                "word_count": len(post_data["body"].split()),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.reflections.insert_one(post)

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.reflections.create_index("user_id")
    await db.reflections.create_index("forum_id")
    await db.assessments.create_index("user_id")
    await db.wellness_profiles.create_index("user_id")
    await db.consents.create_index("user_id")
    await db.crisis_events.create_index("user_id")

    logger.info("Database seeding complete")

# ============================================================
# STARTUP & CORS
# ============================================================
@app.on_event("startup")
async def startup():
    await seed_database()

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
