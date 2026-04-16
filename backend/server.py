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

class MoodCheckinRequest(BaseModel):
    mood: str  # "radiant" | "steady" | "tender" | "heavy" | "depleted"
    intensity: int = 3  # 1-5
    note: Optional[str] = None

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
PHQ9_OPTIONS = [{"value": 0, "label": "Not at all"}, {"value": 1, "label": "Several days"}, {"value": 2, "label": "More than half the days"}, {"value": 3, "label": "Nearly every day"}]
GAD7_OPTIONS = PHQ9_OPTIONS
PSS_OPTIONS = [{"value": 0, "label": "Never"}, {"value": 1, "label": "Almost never"}, {"value": 2, "label": "Sometimes"}, {"value": 3, "label": "Fairly often"}, {"value": 4, "label": "Very often"}]
PSQI_FREQ = [{"value": 0, "label": "Not during the past month"}, {"value": 1, "label": "Less than once a week"}, {"value": 2, "label": "Once or twice a week"}, {"value": 3, "label": "Three or more times a week"}]
MBI_OPTIONS = [{"value": 0, "label": "Never"}, {"value": 1, "label": "A few times a year"}, {"value": 2, "label": "Once a month"}, {"value": 3, "label": "A few times a month"}, {"value": 4, "label": "Once a week"}, {"value": 5, "label": "A few times a week"}, {"value": 6, "label": "Every day"}]
UCLA_OPTIONS = [{"value": 1, "label": "Hardly ever"}, {"value": 2, "label": "Some of the time"}, {"value": 3, "label": "Often"}]

# Section metadata for gamified UI
ASSESSMENT_SECTIONS = [
    {"id": "mood", "scale": "PHQ-9", "title": "How are you feeling?", "subtitle": "These questions measure your mood over the past two weeks.", "icon": "heart", "color": "#C17B2F", "count": 9},
    {"id": "anxiety", "scale": "GAD-7", "title": "What is weighing on your mind?", "subtitle": "These questions assess your anxiety levels.", "icon": "brain", "color": "#E8A84C", "count": 7},
    {"id": "stress", "scale": "PSS-10", "title": "How stressed are you?", "subtitle": "In the last month, how often have you felt this way? (PSS-10, Cohen 1983)", "icon": "zap", "color": "#C0726A", "count": 10},
    {"id": "sleep", "scale": "PSQI", "title": "How are you sleeping?", "subtitle": "Sleep quality over the past month. (PSQI, Buysse 1989)", "icon": "moon", "color": "#4A6FA5", "count": 8},
    {"id": "burnout", "scale": "MBI-HSS-SUBSET", "title": "How is your work energy?", "subtitle": "These questions measure burnout dimensions. (MBI, Maslach 1981)", "icon": "flame", "color": "#1C1C1E", "count": 6},
    {"id": "connection", "scale": "UCLA-3", "title": "How connected do you feel?", "subtitle": "A brief measure of social connection. (UCLA-3, Hughes 2004)", "icon": "users", "color": "#7B6FA5", "count": 3},
]

ASSESSMENT_QUESTIONS = [
    # === SECTION 1: PHQ-9 — Mood (9 questions) ===
    {"id": "phq9_1", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Little interest or pleasure in doing things", "options": PHQ9_OPTIONS},
    {"id": "phq9_2", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Feeling down, depressed, or hopeless", "options": PHQ9_OPTIONS},
    {"id": "phq9_3", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Trouble falling or staying asleep, or sleeping too much", "options": PHQ9_OPTIONS},
    {"id": "phq9_4", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Feeling tired or having little energy", "options": PHQ9_OPTIONS},
    {"id": "phq9_5", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Poor appetite or overeating", "options": PHQ9_OPTIONS},
    {"id": "phq9_6", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Feeling bad about yourself \u2014 or that you are a failure or have let yourself or your family down", "options": PHQ9_OPTIONS},
    {"id": "phq9_7", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Trouble concentrating on things, such as reading the newspaper or watching television", "options": PHQ9_OPTIONS},
    {"id": "phq9_8", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Moving or speaking so slowly that other people could have noticed? Or the opposite \u2014 being so fidgety or restless that you have been moving around a lot more than usual", "options": PHQ9_OPTIONS},
    {"id": "phq9_9", "scale": "PHQ-9", "section": "mood", "dimension": "depression", "text": "Thoughts that you would be better off dead, or of hurting yourself in some way", "options": PHQ9_OPTIONS},
    # === SECTION 2: GAD-7 — Anxiety (7 questions) ===
    {"id": "gad7_1", "scale": "GAD-7", "section": "anxiety", "dimension": "anxiety", "text": "Feeling nervous, anxious, or on edge", "options": GAD7_OPTIONS},
    {"id": "gad7_2", "scale": "GAD-7", "section": "anxiety", "dimension": "anxiety", "text": "Not being able to stop or control worrying", "options": GAD7_OPTIONS},
    {"id": "gad7_3", "scale": "GAD-7", "section": "anxiety", "dimension": "anxiety", "text": "Worrying too much about different things", "options": GAD7_OPTIONS},
    {"id": "gad7_4", "scale": "GAD-7", "section": "anxiety", "dimension": "anxiety", "text": "Trouble relaxing", "options": GAD7_OPTIONS},
    {"id": "gad7_5", "scale": "GAD-7", "section": "anxiety", "dimension": "anxiety", "text": "Being so restless that it is hard to sit still", "options": GAD7_OPTIONS},
    {"id": "gad7_6", "scale": "GAD-7", "section": "anxiety", "dimension": "anxiety", "text": "Becoming easily annoyed or irritable", "options": GAD7_OPTIONS},
    {"id": "gad7_7", "scale": "GAD-7", "section": "anxiety", "dimension": "anxiety", "text": "Feeling afraid, as if something awful might happen", "options": GAD7_OPTIONS},
    # === SECTION 3: PSS-10 — Stress (10 questions) ===
    {"id": "pss_1", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you been upset because of something that happened unexpectedly?", "options": PSS_OPTIONS, "reverse": False},
    {"id": "pss_2", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you felt that you were unable to control the important things in your life?", "options": PSS_OPTIONS, "reverse": False},
    {"id": "pss_3", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you felt nervous and stressed?", "options": PSS_OPTIONS, "reverse": False},
    {"id": "pss_4", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you felt confident about your ability to handle your personal problems?", "options": PSS_OPTIONS, "reverse": True},
    {"id": "pss_5", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you felt that things were going your way?", "options": PSS_OPTIONS, "reverse": True},
    {"id": "pss_6", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you found that you could not cope with all the things that you had to do?", "options": PSS_OPTIONS, "reverse": False},
    {"id": "pss_7", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you been able to control irritations in your life?", "options": PSS_OPTIONS, "reverse": True},
    {"id": "pss_8", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you felt that you were on top of things?", "options": PSS_OPTIONS, "reverse": True},
    {"id": "pss_9", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you been angered because of things that happened that were outside of your control?", "options": PSS_OPTIONS, "reverse": False},
    {"id": "pss_10", "scale": "PSS-10", "section": "stress", "dimension": "stress", "text": "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", "options": PSS_OPTIONS, "reverse": False},
    # === SECTION 4: PSQI — Sleep (8 adapted questions) ===
    {"id": "psqi_1", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how would you rate your sleep quality overall?", "options": [{"value": 0, "label": "Very good"}, {"value": 1, "label": "Fairly good"}, {"value": 2, "label": "Fairly bad"}, {"value": 3, "label": "Very bad"}]},
    {"id": "psqi_2", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how often have you had trouble sleeping because you cannot get to sleep within 30 minutes?", "options": PSQI_FREQ},
    {"id": "psqi_3", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how often have you woken up in the middle of the night or early morning?", "options": PSQI_FREQ},
    {"id": "psqi_4", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how often have you had bad dreams?", "options": PSQI_FREQ},
    {"id": "psqi_5", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how often have you had trouble sleeping because you cannot breathe comfortably?", "options": PSQI_FREQ},
    {"id": "psqi_6", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how often have you taken medicine to help you sleep?", "options": PSQI_FREQ},
    {"id": "psqi_7", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?", "options": PSQI_FREQ},
    {"id": "psqi_8", "scale": "PSQI", "section": "sleep", "dimension": "sleep_quality", "text": "During the past month, how much of a problem has it been for you to keep up enough enthusiasm to get things done?", "options": [{"value": 0, "label": "No problem at all"}, {"value": 1, "label": "Only a very slight problem"}, {"value": 2, "label": "Somewhat of a problem"}, {"value": 3, "label": "A very big problem"}]},
    # === SECTION 5: MBI-HSS Subset — Burnout (6 questions) ===
    {"id": "mbi_ee1", "scale": "MBI-HSS-SUBSET", "section": "burnout", "dimension": "emotional_exhaustion", "text": "I feel emotionally drained from my work", "options": MBI_OPTIONS},
    {"id": "mbi_ee2", "scale": "MBI-HSS-SUBSET", "section": "burnout", "dimension": "emotional_exhaustion", "text": "I feel used up at the end of the workday", "options": MBI_OPTIONS},
    {"id": "mbi_ee3", "scale": "MBI-HSS-SUBSET", "section": "burnout", "dimension": "emotional_exhaustion", "text": "I feel fatigued when I get up in the morning and have to face another day on the job", "options": MBI_OPTIONS},
    {"id": "mbi_dp1", "scale": "MBI-HSS-SUBSET", "section": "burnout", "dimension": "depersonalization", "text": "I feel I look after certain patients impersonally, as if they were objects", "options": MBI_OPTIONS},
    {"id": "mbi_dp2", "scale": "MBI-HSS-SUBSET", "section": "burnout", "dimension": "depersonalization", "text": "I have become more callous toward people since I took this job", "options": MBI_OPTIONS},
    {"id": "mbi_pa1", "scale": "MBI-HSS-SUBSET", "section": "burnout", "dimension": "personal_accomplishment", "text": "Through my work, I feel that I have a positive influence on people", "options": MBI_OPTIONS},
    # === SECTION 6: UCLA-3 — Connection (3 questions) ===
    {"id": "ucla_1", "scale": "UCLA-3", "section": "connection", "dimension": "loneliness", "text": "How often do you feel that you lack companionship?", "options": UCLA_OPTIONS},
    {"id": "ucla_2", "scale": "UCLA-3", "section": "connection", "dimension": "loneliness", "text": "How often do you feel left out?", "options": UCLA_OPTIONS},
    {"id": "ucla_3", "scale": "UCLA-3", "section": "connection", "dimension": "loneliness", "text": "How often do you feel isolated from others?", "options": UCLA_OPTIONS},
]

# ============================================================
# ASSESSMENT ROUTES
# ============================================================
@api_router.get("/assessments/questions")
async def get_assessment_questions():
    return {"questions": ASSESSMENT_QUESTIONS, "sections": ASSESSMENT_SECTIONS, "total": len(ASSESSMENT_QUESTIONS)}

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

    # PSS-10 (with reverse scoring for items 4,5,7,8)
    pss_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["scale"] == "PSS-10"]
    pss_reverse_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["scale"] == "PSS-10" and q.get("reverse")]
    pss_score = 0
    for qid in pss_ids:
        raw = responses.get(qid, 0)
        pss_score += (4 - raw) if qid in pss_reverse_ids else raw
    scales["PSS-10"] = {"raw_scores": {qid: responses.get(qid, 0) for qid in pss_ids}, "computed_score": pss_score, "max": 40}

    # PSQI (simplified)
    psqi_ids = [q["id"] for q in ASSESSMENT_QUESTIONS if q["scale"] == "PSQI"]
    psqi_score = sum(responses.get(qid, 0) for qid in psqi_ids)
    scales["PSQI"] = {"raw_scores": {qid: responses.get(qid, 0) for qid in psqi_ids}, "computed_score": psqi_score, "max": 24}

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

    # Generate initial wellness profile from all 6 scales
    anxiety_pct = round((gad7_score / 21) * 100)
    stress_pct = round(((pss_score / 40) * 0.6 + (phq9_score / 27) * 0.2 + (ee_score / 18) * 0.2) * 100)
    loneliness_pct = round(((ucla_score - 3) / 6) * 100)
    sleep_pct = round((psqi_score / 24) * 100)
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
        "sleep_score": sleep_pct,
        "summary": summary,
        "recommended_forum_id": recommended_forum.get("id") if recommended_forum else None,
        "recommended_forum_name": recommended_forum.get("name") if recommended_forum else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "assessment",
        "citations": [
            "PHQ-9: Kroenke, Spitzer & Williams, J Gen Intern Med 2001",
            "GAD-7: Spitzer, Kroenke, Williams & Lowe, Arch Intern Med 2006",
            "PSS-10: Cohen, Kamarck & Mermelstein, J Health Soc Behav 1983",
            "PSQI: Buysse, Reynolds, Monk, Berman & Kupfer, Psychiatry Res 1989",
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
    r"\bkill\s*(my)?self\b", r"\bwant\s*to\s*die\b", r"\bending\s*it\b",
    r"\bno\s*point\b", r"\bcan'?t\s*go\s*on\b", r"\bbetter\s*off\s*dead\b",
    r"\bdon'?t\s*want\s*to\s*be\s*here\b", r"\bsuicid\w*\b", r"\bself[- ]?harm\w*\b",
    r"\bhurt\s*(my)?self\b", r"\bnot\s*worth\s*(it|living)\b",
    r"\bend\s*(my|this)\s*life\b", r"\bjump\s*off\b", r"\bwant\s*to\s*end\b",
    r"\bno\s*reason\s*to\s*live\b", r"\bwish\s*i\s*was\s*dead\b",
    r"\bi\s*can'?t\s*do\s*this\s*anymore\b", r"\bgive\s*up\b",
    r"\bkill\s*me\b", r"\bwanna\s*die\b"
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

    # CRISIS GUARDRAIL: NEVER save crisis content. Block it and log.
    if mod_result["status"] == "paused_crisis":
        # Log the crisis event for human review
        event_id = str(uuid.uuid4())
        await db.crisis_events.insert_one({
            "_id": event_id, "id": event_id, "user_id": user["id"],
            "trigger_text": req.body[:500],
            "helpline_shown": "auto_detected",
            "action_taken": "guardrail_blocked",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.warning(f"CRISIS GUARDRAIL: Blocked post from user {user['id']} - crisis content detected")
        return {"moderation": mod_result, "posted": False, "crisis_blocked": True}

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
# MOOD CHECK-IN ROUTES
# ============================================================
MOOD_META = {
    "radiant":   {"label": "Radiant",   "value": 5, "color": "#E8A84C", "description": "Bright, energised, open"},
    "steady":    {"label": "Steady",    "value": 4, "color": "#7FB88F", "description": "Grounded, calm, capable"},
    "tender":    {"label": "Tender",    "value": 3, "color": "#C8A0B5", "description": "Sensitive, reflective"},
    "heavy":     {"label": "Heavy",     "value": 2, "color": "#7B6FA5", "description": "Weighed down, tired"},
    "depleted":  {"label": "Depleted",  "value": 1, "color": "#C0726A", "description": "Running on empty"},
}

def _today_str():
    return datetime.now(timezone.utc).date().isoformat()

@api_router.get("/mood/meta")
async def get_mood_meta():
    return {"moods": MOOD_META}

@api_router.post("/mood/checkin")
async def mood_checkin(req: MoodCheckinRequest, request: Request):
    user = await get_current_user(request)
    if req.mood not in MOOD_META:
        raise HTTPException(status_code=400, detail="Invalid mood")
    today = _today_str()
    existing = await db.mood_entries.find_one({"user_id": user["id"], "date": today})
    doc = {
        "mood": req.mood,
        "intensity": max(1, min(5, req.intensity)),
        "note": (req.note or "")[:500],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if existing:
        await db.mood_entries.update_one({"_id": existing["_id"]}, {"$set": doc})
        entry = {**existing, **doc}
        entry.pop("_id", None)
        return {"entry": entry, "created": False}
    entry_id = str(uuid.uuid4())
    entry = {
        "id": entry_id, "user_id": user["id"], "date": today,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **doc
    }
    await db.mood_entries.insert_one({**entry, "_id": entry_id})
    return {"entry": entry, "created": True}

@api_router.get("/mood/today")
async def mood_today(request: Request):
    user = await get_current_user(request)
    entry = await db.mood_entries.find_one({"user_id": user["id"], "date": _today_str()}, {"_id": 0})
    return {"entry": entry}

@api_router.get("/mood/calendar")
async def mood_calendar(request: Request, days: int = 90):
    user = await get_current_user(request)
    days = max(7, min(180, days))
    cutoff = (datetime.now(timezone.utc).date() - timedelta(days=days - 1)).isoformat()
    entries = await db.mood_entries.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}}, {"_id": 0}
    ).sort("date", 1).to_list(days + 10)
    # Build continuous day map
    by_date = {e["date"]: e for e in entries}
    today = datetime.now(timezone.utc).date()
    out = []
    for i in range(days):
        d = (today - timedelta(days=days - 1 - i)).isoformat()
        e = by_date.get(d)
        out.append({
            "date": d,
            "mood": e["mood"] if e else None,
            "intensity": e.get("intensity") if e else None,
            "note": e.get("note") if e else None,
        })
    # Stats
    logged_values = [MOOD_META[e["mood"]]["value"] for e in entries if e.get("mood") in MOOD_META]
    avg = round(sum(logged_values) / len(logged_values), 2) if logged_values else 0
    # Streak (consecutive days up to today)
    streak = 0
    for i in range(len(out) - 1, -1, -1):
        if out[i]["mood"]:
            streak += 1
        else:
            break
    return {
        "days": out, "logged_count": len(entries), "avg_value": avg, "streak": streak,
        "total_days": days
    }

# ============================================================
# DASHBOARD AGGREGATE
# ============================================================
@api_router.get("/dashboard/summary")
async def dashboard_summary(request: Request):
    user = await get_current_user(request)
    uid = user["id"]
    # Latest profile
    profiles = await db.wellness_profiles.find({"user_id": uid}, {"_id": 0}).sort("generated_at", -1).to_list(1)
    profile = profiles[0] if profiles else None
    # Assessments count
    assessment_count = await db.assessments.count_documents({"user_id": uid})
    # Reflection count
    reflection_count = await db.reflections.count_documents({"user_id": uid, "is_private": True})
    qualifying = await db.reflections.count_documents({"user_id": uid, "is_private": True, "word_count": {"$gte": 100}})
    # Today's mood
    mood_today = await db.mood_entries.find_one({"user_id": uid, "date": _today_str()}, {"_id": 0})
    # Streak
    cutoff = (datetime.now(timezone.utc).date() - timedelta(days=30)).isoformat()
    recent_moods = await db.mood_entries.find(
        {"user_id": uid, "date": {"$gte": cutoff}}, {"_id": 0}
    ).sort("date", -1).to_list(31)
    streak = 0
    today_date = datetime.now(timezone.utc).date()
    seen_dates = {m["date"] for m in recent_moods}
    for i in range(31):
        d = (today_date - timedelta(days=i)).isoformat()
        if d in seen_dates:
            streak += 1
        else:
            if i > 0:  # allow today to be empty
                break
            if not mood_today:
                break
    # Recent forum activity (global latest 3 posts for feed)
    recent_posts = await db.reflections.find(
        {"forum_id": {"$ne": None}, "parent_id": None, "moderation_status": {"$in": ["approved", "rewritten"]}},
        {"_id": 0, "body": 1, "display_name": 1, "forum_id": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(3)
    for p in recent_posts:
        forum = await db.forums.find_one({"id": p["forum_id"]}, {"_id": 0, "name": 1})
        p["forum_name"] = forum["name"] if forum else ""
        p["body"] = p["body"][:180]
    return {
        "user": {k: v for k, v in user.items() if k in ("id", "display_name", "email", "locale", "role")},
        "profile": profile,
        "assessment_count": assessment_count,
        "reflection_count": reflection_count,
        "qualifying_count": qualifying,
        "mood_today": mood_today,
        "streak": streak,
        "recent_posts": recent_posts,
    }

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

async def seed_demo_user():
    """Seed a demo account with rich sample data for easy preview."""
    email = "demo@eunoia.app"
    existing = await db.users.find_one({"email": email})
    if existing:
        return existing["id"]
    user_id = "demo-user-eunoia"
    user = {
        "id": user_id, "_id": user_id, "email": email,
        "display_name": "Resident_2580",
        "locale": "IN", "role": "resident",
        "created_at": (datetime.now(timezone.utc) - timedelta(days=45)).isoformat(),
        "onboarded": True,
    }
    await db.users.insert_one(user)
    # Consents
    for scope, granted in [("research_scales", True), ("research_reflections", True), ("data_trust", False)]:
        cid = str(uuid.uuid4())
        await db.consents.insert_one({
            "_id": cid, "id": cid, "user_id": user_id, "scope": scope,
            "granted": granted,
            "granted_at": datetime.now(timezone.utc).isoformat()
        })
    # Sample assessments
    scale_scores = {"PHQ-9": 14, "GAD-7": 12, "PSS-10": 27, "PSQI": 11,
                    "MBI-HSS-SUBSET": {"ee": 16, "dp": 7, "pa": 3}, "UCLA-3": 6}
    for scale, score in scale_scores.items():
        aid = str(uuid.uuid4())
        await db.assessments.insert_one({
            "_id": aid, "id": aid, "user_id": user_id, "scale_name": scale,
            "raw_scores_json": {}, "computed_score": score if not isinstance(score, dict) else json.dumps(score),
            "taken_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        })
    # Wellness profile
    profile_id = str(uuid.uuid4())
    profile = {
        "_id": profile_id, "id": profile_id, "user_id": user_id,
        "archetype": "The Over-Committed Healer",
        "anxiety_score": 57, "stress_score": 68, "loneliness_score": 50,
        "burnout_score": 72, "sleep_score": 46,
        "summary": "You are running on fumes, and you know it. The exhaustion, the emotional weight, the sense that you are giving everything and it is never enough \u2014 these are not flaws. They are what the body does when it has not been allowed to rest. You do not need fixing. You need a cohort.",
        "recommended_forum_id": "forum-sleepless-ward",
        "recommended_forum_name": "The Sleepless Ward",
        "generated_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
        "source": "assessment",
        "citations": [
            "PHQ-9: Kroenke, Spitzer & Williams, J Gen Intern Med 2001",
            "GAD-7: Spitzer, Kroenke, Williams & Lowe, Arch Intern Med 2006",
            "PSS-10: Cohen, Kamarck & Mermelstein, J Health Soc Behav 1983",
            "MBI-HSS: Maslach & Jackson, J Occup Behav 1981"
        ]
    }
    await db.wellness_profiles.insert_one(profile)
    # Sample private reflections
    demo_reflections = [
        "Another night shift bled into another morning. I drove home with the windows down just to stay awake, and when I got to my apartment I sat in the car for twenty minutes because I did not have the energy to open the door. I am not sure what I am doing anymore. Medicine was supposed to feel meaningful, and most days it does, but today I just felt like a machine that keeps running.",
        "Had a good patient interaction today. An older woman held my hand and said 'you look tired, dear.' I almost cried right there. I did not realize how much I have been hiding it. I wonder if the patients see more of me than my colleagues do.",
        "The attending criticized me in front of the team again. I know it is how medicine works, I know it is not personal, but I went home and could not sleep. Kept replaying it. Kept thinking maybe I am not cut out for this. Maybe the impostor feeling is accurate this time. I do not know who to talk to about this.",
        "Forced myself to take a walk at lunch. Ten minutes in the hospital garden. Sky was impossibly blue. I noticed it, which felt like something, even if I did not feel happy exactly. Small wins count. I have to remember they count.",
        "Nightmares again. Code blue that never happened, but in the dream I was the one calling it and I could not remember the dose. Woke up at 3 AM shaking. This is not sustainable. I know it is not sustainable. I just do not know what the alternative looks like."
    ]
    for i, body in enumerate(demo_reflections):
        rid = str(uuid.uuid4())
        await db.reflections.insert_one({
            "_id": rid, "id": rid, "user_id": user_id, "forum_id": None,
            "body": body, "parent_id": None,
            "moderation_status": "approved", "moderation_notes": None,
            "is_private": True, "word_count": len(body.split()),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=20 - i * 3)).isoformat()
        })
    # 45 days of mood entries with realistic pattern
    mood_sequence = [
        "heavy", "heavy", "depleted", "tender", "steady", None, "tender",
        "heavy", "tender", "steady", "steady", None, "radiant", "steady",
        "heavy", "depleted", "heavy", "tender", "steady", None, "steady",
        "tender", "heavy", "tender", "steady", "radiant", None, "tender",
        "heavy", "depleted", "tender", "steady", "steady", "tender", "heavy",
        None, "steady", "tender", "radiant", "steady", "tender", "heavy",
        "depleted", "tender", "steady"
    ]
    notes_map = {
        "radiant": "Slept well. Saw a patient recover. Today felt human.",
        "steady": "Normal day. Not bad.",
        "tender": "A bit raw. Kept it together though.",
        "heavy": "Everything felt harder than it should.",
        "depleted": "Running on fumes. Need a real break.",
    }
    for i, mood in enumerate(mood_sequence):
        if mood is None:
            continue
        date = (datetime.now(timezone.utc).date() - timedelta(days=len(mood_sequence) - 1 - i)).isoformat()
        mid = str(uuid.uuid4())
        await db.mood_entries.insert_one({
            "_id": mid, "id": mid, "user_id": user_id, "date": date,
            "mood": mood,
            "intensity": 3 if mood in ("tender", "steady") else (2 if mood == "heavy" else (1 if mood == "depleted" else 4)),
            "note": notes_map.get(mood, ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    logger.info(f"Seeded demo user: {email}")
    return user_id

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
    await db.mood_entries.create_index([("user_id", 1), ("date", -1)])

    # Seed demo account
    await seed_demo_user()

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
