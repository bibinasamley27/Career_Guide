# AI Career Guide — Software Design Document (SDD)

**Version:** 1.0 (Draft)
**Status:** Source of truth for implementation
**Project type:** College-level Agentic AI application

---

## 1. Overview

### 1.1 Problem Statement
Students frequently do not know which careers align with their interests and existing skills, which skills they are missing for a target career, or what learning path to follow to close those gaps.

### 1.2 Solution
AI Career Guide is a web application that lets a student build a profile, submit an assessment of their interests/skills, and receive:
- Ranked, explainable career recommendations with a transparent match score
- A skill-gap analysis (have / missing) against each career
- A personalized, staged learning roadmap
- Curated learning resources and project suggestions
- A dashboard to revisit and manage saved results over time

### 1.3 Why "Agentic," Not a Chatbot
The system is orchestrated by a **Career Guide Agent** that follows an explicit plan → act → observe → evaluate → re-plan loop, coordinating modular capabilities (profile analysis, career matching, skill-gap analysis, roadmap generation, resource retrieval, evaluation). It is not a single prompt → LLM → answer flow. See §7.

### 1.4 Goals
- G1: Deterministic, explainable career matching (not opaque LLM scoring)
- G2: Clear skill-gap output grounded in the user's actual data
- G3: Realistic, staged, prerequisite-respecting learning roadmaps
- G4: No fabricated resources/URLs — grounded in a resource database
- G5: A professional career-planning product UI, not a chat window
- G6: Modular monolith — easy to build, test, and explain in a project review

### 1.5 Non-Goals
- Not a general-purpose chatbot
- Not a job-matching/recruiting marketplace
- Not a distributed/microservices system
- No guarantee of job placement or outcomes

---

## 2. Architecture

### 2.1 High-Level Architecture
Modular monolith with four logical layers:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + TS + Vite + Tailwind)                 │
│  Pages -> API client -> React Query/Zustand state         │
└───────────────────────┬───────────────────────────────────┘
                         │ HTTPS / JSON
┌───────────────────────▼───────────────────────────────────┐
│  Backend API (Express + TS)                                │
│  Routes -> Controllers (thin) -> Services (business logic)│
│  Middleware: auth, validation (Zod), error handling, rate  │
│  limiting                                                   │
└───────┬───────────────────────────────┬─────────────────────┘
        │                               │
┌───────▼───────────┐          ┌────────▼─────────────────────┐
│  Data layer         │          │  Career Guide Agent layer     │
│  Prisma + PostgreSQL │          │  Orchestrator + capabilities  │
│  (repositories)      │          │  + AI provider adapter        │
└──────────────────────┘          └───────────┬───────────────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │  LLM Provider         │
                                    │  (provider-agnostic   │
                                    │  adapter, e.g. Claude)│
                                    └────────────────────────┘
```

### 2.2 Repository Structure
```
career-guide/
  frontend/
    src/
      pages/
      components/
      hooks/
      lib/ (api client, types)
      state/
  backend/
    src/
      routes/
      controllers/
      services/
      agent/
        capabilities/
        CareerGuideAgent.ts
      repositories/
      middleware/
      ai/ (provider adapter, schema validation)
      lib/
      config/
  prisma/
    schema.prisma
    seed.ts
  docs/
    SDD.md
  .env.example
  README.md
```

### 2.3 Layering Rules
- Routes: only wire HTTP → controller.
- Controllers: parse/validate request, call one service, shape response. No business logic.
- Services: business logic, orchestrate repositories and the agent.
- Repositories: all Prisma/database access lives here — never call Prisma directly from a controller or route.
- Agent/capabilities: pure functions/classes taking typed input, returning typed + validated output.

---

## 3. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | SPA |
| Styling | Tailwind CSS | utility-first, design tokens in `tailwind.config` |
| Frontend state/data | React Query (server state) + lightweight store (client/UI state) | avoids over-engineering with Redux |
| Backend | Node.js + Express + TypeScript | |
| ORM/DB | Prisma + PostgreSQL | |
| Auth | JWT (access token, httpOnly cookie) | bcrypt/Argon2 for password hashing |
| Validation | Zod | shared schema shapes mirrored on frontend where useful |
| AI | Provider-agnostic adapter (`AiProvider` interface); default implementation targets Claude via the Anthropic API | structured JSON output, schema-validated |
| Testing | Vitest/Jest (backend + agent), React Testing Library (frontend) | |

---

## 4. Data Model

### 4.1 Entities (Prisma-level, conceptual)

- **User** — id, email, passwordHash, createdAt, updatedAt
- **Profile** — userId (1:1 User), name, education, degreeBranch, experienceLevel, preferredDomains[], careerGoal, learningPreference, weeklyLearningHours
- **Interest** — id, name, category
- **UserInterest** — userId, interestId, weight (optional strength 1–5)
- **Skill** — id, name, category
- **UserSkill** — userId, skillId, proficiency (beginner/intermediate/advanced)
- **Career** — id, title, description, domain
- **CareerSkill** — careerId, skillId, importance (required/preferred), minProficiency
- **CareerInterest** — careerId, interestId, weight
- **Resource** — id, title, type (course/doc/tutorial/book/practice-platform/project-idea), url (nullable — never fabricated), provider, level
- **CareerResource** — careerId, resourceId, relevance
- **Roadmap** — id, userId, careerId, createdAt, status
- **RoadmapStage** — id, roadmapId, order, title, duration, objectives[], completionCriteria
- **RoadmapSkill** — roadmapStageId, skillId
- **ProjectRecommendation** — id, roadmapStageId (nullable) / careerId, title, description, difficulty
- **SavedCareer** — userId, careerId, savedAt, notes
- **Assessment** — id, userId, submittedAt, snapshot of interests/skills/profile fields at submission time
- **Progress** *(optional)* — userId, roadmapStageId, status (not-started/in-progress/done), updatedAt
- **AgentRun** — id, userId, goal, status (pending/running/success/failed), selectedCapabilities[], toolExecutionLog (structured, no chain-of-thought), startedAt, finishedAt, errorMessage, resultSummary, resultRefId

### 4.2 Key Relationships
- User 1:1 Profile
- User 1:N UserInterest / UserSkill / SavedCareer / Assessment / Roadmap / AgentRun
- Career N:M Interest (via CareerInterest), N:M Skill (via CareerSkill), N:M Resource (via CareerResource)
- Roadmap 1:N RoadmapStage 1:N RoadmapSkill / ProjectRecommendation

### 4.3 Seed Data
Seed the catalog with at least: Software Developer, Frontend Developer, Backend Developer, Full Stack Developer, Data Analyst, Data Scientist, Machine Learning Engineer, AI Engineer, Cybersecurity Analyst, Cloud/DevOps Engineer, UI/UX Designer, Product/Business Analyst — each with associated CareerSkill and CareerInterest rows, and a starter Resource set. Catalog must be easy to extend (no hard-coded logic keyed to career names).

---

## 5. Career Matching (Deterministic Core)

Match score is computed in code, not by the LLM.

```
CareerMatchScore =
    w1 * InterestAlignment
  + w2 * SkillAlignment
  + w3 * EducationExperienceAlignment
  + w4 * GoalDomainAlignment
```

Default weights (tunable, stored in config): w1=0.30, w2=0.40, w3=0.15, w4=0.15. Score normalized to 0–100.

- **InterestAlignment**: overlap between UserInterest and CareerInterest, weighted by interest weight.
- **SkillAlignment**: proportion of required CareerSkill rows the user already meets (proficiency ≥ minProficiency), weighted by importance (required > preferred).
- **EducationExperienceAlignment**: rule-based lookup table mapping degree/experience level to domain fit.
- **GoalDomainAlignment**: match between stated careerGoal/preferredDomains and career.domain.

Output per career: title, matchScore, matchingSkills[], skillGaps[], and a set of grounded facts (which interests/skills drove the score) that the LLM turns into `whyItMatches` explanation text — the LLM may only phrase the explanation, never alter the underlying facts or score.

Return top N (default 5) ranked careers.

---

## 6. Skill Gap Analysis

Deterministic comparison: for a given career, for each CareerSkill row —
- **Already have**: UserSkill exists with proficiency ≥ minProficiency
- **Partially matching**: UserSkill exists but proficiency < minProficiency
- **Missing**: no UserSkill row

Each gap gets a **priority** (required skills first, then by how foundational the skill is per a simple skill-dependency table) and a **suggested next action**. The LLM is used only to personalize the phrasing/ordering rationale, not to invent gaps.

---

## 7. Career Guide Agent (Agentic Layer)

### 7.1 Orchestration Flow
```
User Goal / Profile
  → Agent.receiveGoal()
  → Agent.validateSufficientInfo()      (deterministic)
  → capability: analyzeProfile()
  → Agent.plan()                         (select which capabilities are needed)
  → capability: matchCareers()
  → capability: analyzeSkillGap()        (per top career, or selected career)
  → capability: generateRoadmap()        (when a career is selected)
  → capability: retrieveResources()
  → capability: evaluateCareerGuidance() (validation/quality check)
  → re-plan if evaluation fails (bounded retries, e.g. max 2)
  → validate structured output (Zod schema)
  → return final result + persist AgentRun
```

### 7.2 Capabilities (modular, independently testable)
| Capability | Type | Responsibility |
|---|---|---|
| `analyzeProfile()` | mixed | Checks completeness; LLM used to semantically interpret free-text interests/goals into structured tags |
| `matchCareers()` | deterministic | Runs the scoring model in §5 |
| `analyzeSkillGap()` | deterministic + LLM phrasing | Runs §6, LLM personalizes explanation only |
| `generateRoadmap()` | LLM (schema-validated) + deterministic prerequisite checks | Produces staged roadmap; deterministic layer enforces prerequisite ordering and realistic duration bounds |
| `retrieveResources()` | deterministic (DB lookup) | Pulls from Resource/CareerResource; never invents URLs |
| `evaluateCareerGuidance()` | deterministic checks + LLM sanity pass | Confirms schema validity, non-empty required fields, score consistency, no fabricated resources |

### 7.3 Agent State (what gets persisted — see AgentRun)
Store only: run id, status, selected capabilities, tool execution status/timing, errors, final result reference, short execution summary. **Do not persist chain-of-thought or raw model reasoning.**

### 7.4 Structured AI Output Contract
```json
{
  "recommendations": [
    {
      "careerId": "string",
      "careerTitle": "string",
      "matchScore": 92,
      "whyItMatches": ["string", "..."],
      "matchingSkills": ["string", "..."],
      "skillGaps": ["string", "..."],
      "nextStep": "string"
    }
  ],
  "roadmap": {
    "careerId": "string",
    "stages": [
      {
        "title": "string",
        "duration": "string",
        "topics": ["string"],
        "objectives": ["string"],
        "resources": ["resourceId"],
        "practiceTask": "string",
        "completionCriteria": "string"
      }
    ]
  }
}
```
Every AI response is validated against this schema (Zod) before use. On failure: (1) one controlled retry with an error hint appended to the prompt, (2) fall back to deterministic partial output (e.g., matching without explanations) if retry fails, (3) otherwise return a controlled error to the client — never an unvalidated raw response.

---

## 8. API Design

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/profile
PUT    /api/profile

POST   /api/assessment

POST   /api/recommendations        (triggers Career Guide Agent run)
GET    /api/recommendations/:id

GET    /api/careers
GET    /api/careers/:id

POST   /api/skill-gap

POST   /api/roadmap
GET    /api/roadmap/:id

GET    /api/resources

POST   /api/saved-careers
GET    /api/saved-careers
DELETE /api/saved-careers/:id

POST   /api/progress   (optional)
GET    /api/progress   (optional)

GET    /api/agent-runs/:id   (status/debug view of an agent run)
```

All authenticated routes require a valid JWT (httpOnly cookie). Expensive AI endpoints (`/recommendations`, `/roadmap`) are rate-limited per user.

---

## 9. Frontend

### 9.1 Pages
**Public:** Landing, Login, Register
**Authenticated:** Dashboard, Profile, Career Assessment, Recommendations, Career Details, Skill Gap, Learning Roadmap, Resources, Saved Careers, Settings
**Optional:** Progress, Admin Dashboard

### 9.2 Core Flow
Profile → Assessment → Career Recommendations → Skill Gap → Roadmap → Resources → Save → Dashboard

### 9.3 Design Direction
Professional career-planning product look (cards, progress indicators, clear nav) — explicitly not a chat-first UI. A chatbot may be added later as a secondary entry point only.

---

## 10. Security Requirements
- Passwords hashed with bcrypt/Argon2; never stored or returned in plaintext or hash form to the client
- JWT in httpOnly, secure, sameSite cookie
- Auth middleware on all protected routes; server-side authorization checks (never trust client-side role/permission checks)
- Zod validation on every request body
- Environment variables for all secrets; `.env` never committed; `.env.example` provided
- LLM/API keys used only server-side, never exposed to frontend
- Request size limits; sane CORS policy scoped to the frontend origin
- Rate limiting on `/api/recommendations` and `/api/roadmap`
- No stack traces returned to the client; centralized error handler maps errors to safe messages
- No logging of passwords or tokens

---

## 11. Error Handling
- Backend: centralized Express error-handling middleware; typed error classes (ValidationError, AuthError, AiError, NotFoundError) mapped to HTTP status + safe message
- AI failures degrade gracefully (see §7.4 retry/fallback) — never an infinite loading state
- Frontend: every async call has loading/error/empty states; distinct handling for network failure, auth failure, AI failure, empty recommendations, invalid input, roadmap failure

---

## 12. Testing Requirements

**Backend:** auth flows, validation, career scoring (§5) unit tests with fixed fixtures, skill-gap logic, roadmap generation (prerequisite ordering), API endpoint integration tests, authorization checks.

**AI/Agent:** structured output schema validation, behavior on missing profile information, recommendation consistency across repeated runs on the same input, skill-gap consistency, roadmap consistency (respects prerequisites, realistic durations), resource validation (no fabricated URLs), hallucination checks (career facts must trace back to DB).

**Frontend:** login, registration, profile form, assessment form, recommendation display, roadmap display, loading states, error states.

---

## 13. Definition of Done

A phase/feature is done when:
1. It matches this SDD (or a documented, explicitly approved deviation).
2. Type checks pass (frontend + backend).
3. Relevant tests pass (§12).
4. No secrets or fabricated data are present.
5. Error and loading states are implemented, not stubbed.
6. README/docs updated for any new setup step or decision.

The project overall is done when the flow in §9.2 is fully functional end-to-end for a new user, and the system demonstrably follows the agentic loop in §7.1 rather than a single prompt → answer call.

---

## 14. Open Decisions / Assumptions Made in This Draft
*(flag before implementation if any of these don't match intent)*
- Default match-score weights (§5) are a starting point — tune during Phase 6.
- Default AI provider adapter targets the Anthropic API; swappable via `AiProvider` interface.
- Top-N recommendations defaults to 5.
- Bounded re-plan/retry count defaults to 2.
- Admin Dashboard and Progress tracking are treated as optional/stretch, per the instruction doc.
