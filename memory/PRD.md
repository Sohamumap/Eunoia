# Eunoia PRD - Product Requirements Document

## Original Problem Statement
Eunoia (Greek: beautiful thinking) - The anti-AI-therapy platform where burned-out humans heal each other in anonymous peer circles. Burnout is quantified by background agents from free-form reflections. Users own their data through a consent-based data cooperative.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Radix UI + Lucide icons + Recharts
- **Backend**: FastAPI (Python) with Motor (async MongoDB)
- **Database**: MongoDB
- **LLM**: OpenAI GPT-5.2 via Emergent Universal Key
- **Auth**: Passwordless email (simulated magic-link) with JWT tokens

## What's Been Implemented

### Iteration 1 (April 16, 2026)
- Full MVP: Landing, Signup, Onboarding, Assessment, Profile, Circles, Companion, Hub, Data Cooperative, Crisis Modal

### Iteration 2 (April 16, 2026)
- Full 6-scale clinical battery (43 questions): PHQ-9, GAD-7, PSS-10, PSQI, MBI-HSS, UCLA-3
- Gamified assessment with 6 themed chapters
- Crisis guardrail hardened (regex fix + BLOCK posts + auto-log events)

### Iteration 3 (April 16, 2026) — V2 Visual Design Overhaul
- [x] Atmospheric background system: CSS gradient layers per route (landing warm, circles dark, profile colorful, companion warm)
- [x] 3 artistic background images uploaded to /public/assets/ (bg-glow-figure.jpg, bg-dancer.jpg, bg-colorful-back.jpg)
- [x] Landing page V2: Split hero layout with atmospheric image right, PEER SUPPORT · NOT AI THERAPY overline, Playfair Display 64px headline, DM Sans body
- [x] Concentric circles "How it works" section: SVG rings (PEER/REFLECT/OWN) with radial grid, numbered descriptions, scroll-triggered animation
- [x] Hexagonal radar chart on Wellness Profile: 6 axes (Anxiety, Stress, Burnout, Exhaustion, Loneliness, Accomplishment), warm orange polygon fill, animated vertex expansion
- [x] JetBrains Mono font for data/numbers/scores
- [x] Profile reveal animation: background intensifies, chart animates from center outward, 3 recommendation cards (Circle, Hub, Retake)
- [x] Testimonial cards with editorial typography
- [x] Clinical evidence ribbon with all 6 scales cited
- [x] AtmosphericBg component managing body classes per route

## Prioritized Backlog
### P0
- Real email magic-link auth (SendGrid/Resend)
- Admin dashboard for crisis event review
- Mobile bottom tab bar navigation

### P1
- Like counts on forum posts
- Dot-grid contribution calendar on Data settings
- Loading skeletons (shimmer animation)
- Enhanced breathing exercise with animated SVG circle

### P2
- Data trust revenue share computation engine
- Multi-language support
- NIMHANS n=200 validation study
