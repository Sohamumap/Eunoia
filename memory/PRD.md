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
3. **Expansion**: Founders, engineers, lawyers, teachers

## Core Requirements
- Anonymous peer community with auto-generated display names
- 25-question validated assessment (PHQ-9, GAD-7, MBI-HSS subset, UCLA-3)
- Wellness Profile with archetype labels, animated score bars, compassionate summaries
- Burnout Report Agent: analyzes 3 free-form reflections via LLM to generate personalized profile
- Forum circles with live content moderation (medication, diagnostic, crisis detection)
- Crisis modal with locale-specific helplines (India, US, UK, UAE)
- Data Cooperative with granular consent and contribution tracking
- Wellness Hub with evidence-based micro-practices

## What's Been Implemented (April 16, 2026)
- [x] Landing page with hero text, features, testimonials, clinical evidence ribbon
- [x] Signup flow: email + locale + role → auto display name → JWT auth
- [x] Onboarding: 3 consent toggles with descriptions and disclaimer
- [x] 25-question assessment: PHQ-9, GAD-7, MBI-HSS subset, UCLA-3 (one per screen, progress bar)
- [x] Wellness Profile: archetype label, 4 animated score bars, summary, recommended forum, citations
- [x] Burnout Report Agent: GPT-5.2 analyzes 3 reflections → generates wellness profile
- [x] 4 pre-seeded forums with 12 sample posts
- [x] Circle thread view with compose box and reply functionality
- [x] Live moderation: medication detection, diagnostic language blocking, crisis keyword detection
- [x] LLM-powered rewrite suggestions for flagged medication content
- [x] Crisis modal: locale-specific helplines, peer support request, crisis event logging
- [x] Companion journal: word counter, qualifying tracker, 3-reflection trigger to burnout report
- [x] Data Cooperative: consent management, contribution history, estimated value, data export
- [x] Wellness Hub: 4-7-8 breathing, Stoic reflection, 5-4-3-2-1 grounding
- [x] Global "Get Help Now" button with pulse animation on every authenticated page
- [x] Design system: Playfair Display + DM Sans, cream/charcoal palette, editorial warmth

## Prioritized Backlog
### P0 (Next)
- Polish animations (staggered fade-ups on profile reveal)
- Mobile responsiveness deep testing
- Empty states for all pages

### P1
- Real email magic-link integration (SendGrid/Resend)
- PSQI and PSS-10 scales (extending to full 6-scale battery)
- Push notifications for peer support responses
- Search/filter within circles

### P2
- Data trust revenue share computation engine
- Academic research export pipeline
- Multi-language support (Hindi, Arabic)
- Wearable/HRV integration (Phase 2)
- NIMHANS Bengaluru n=200 validation study

## Next Tasks
1. Polish: mobile responsive testing, animations timing, empty states
2. Add PSQI (sleep) and PSS-10 (stress) scales to assessment
3. Wire real email delivery for magic-link auth
4. Add search/filter functionality within circles
5. Build admin dashboard for crisis event review
