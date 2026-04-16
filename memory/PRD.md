# Eunoia PRD - Product Requirements Document

## Original Problem Statement
Eunoia (Greek: beautiful thinking) - The anti-AI-therapy platform where burned-out humans heal each other in anonymous peer circles. Burnout is quantified by background agents from free-form reflections. Users own their data through a consent-based data cooperative.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Radix UI + Lucide icons
- **Backend**: FastAPI (Python) with Motor (async MongoDB)
- **Database**: MongoDB
- **LLM**: OpenAI GPT-5.2 via Emergent Universal Key (emergentintegrations)
- **Auth**: Passwordless email (simulated magic-link) with JWT tokens

## User Personas
1. **Dr. Priya** (Primary): 2nd-year internal medicine resident, 90-hour weeks, tried Wysa, stopped, no time for therapy
2. **Beachhead**: Medical residents, interns, early-career physicians (India, US, UK, UAE, SEA)

## What's Been Implemented

### Iteration 1 (April 16, 2026)
- Landing page, Signup, Onboarding, 25-question assessment, Wellness Profile
- Burnout Report Agent (GPT-5.2), Circles, Moderation, Crisis modal, Companion, Data Cooperative, Hub

### Iteration 2 (April 16, 2026)
- [x] **Full 6-scale clinical battery**: PHQ-9 (9q), GAD-7 (7q), PSS-10 (10q), PSQI (8q), MBI-HSS (6q), UCLA-3 (3q) = 43 questions total
- [x] **Gamified assessment**: 6 themed chapters with section intros, icons, progress dots, encouraging messages between sections, color-coded per section
- [x] **PSS-10 scoring**: Full 10-question Perceived Stress Scale with reverse scoring for items 4,5,7,8 (Cohen 1983)
- [x] **PSQI adapted**: 8 sleep quality questions from Pittsburgh Sleep Quality Index (Buysse 1989)
- [x] **Wellness Profile**: 5 score bars (Anxiety, Stress, Sleep Disruption, Loneliness, Burnout)
- [x] **Crisis guardrail hardened**: Fixed regex (suicid\w* instead of \b(suicid)\b), added 20 crisis patterns, posts BLOCKED + crisis events auto-logged, crisis modal auto-triggers
- [x] **Forum display names fixed**: Seeded posts now show proper names (Resident_3847, Intern_0933)
- [x] **Login visibility**: Added "Sign in" link on landing page

## Prioritized Backlog
### P0
- Real email magic-link auth
- Admin dashboard for crisis event review

### P1
- Landing page redesign per user HTML reference
- Multi-language support (Hindi, Arabic)
- Push notifications for peer support

### P2
- Data trust revenue share computation
- NIMHANS n=200 validation study
- Wearable/HRV integration
