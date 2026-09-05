# AI Career Guide

The backend includes an authenticated Career Guide AI assistant at `POST /api/assistant/chat`. It uses the existing deterministic career services as its source of truth and can inspect the authenticated user's profile, recommendations, career requirements, skill gaps, roadmap, resources, projects, and saved careers through a bounded tool loop.

## Career Guide AI setup

Copy the backend environment example into the backend environment and set `GEMINI_API_KEY` there. The key is backend-only. `GEMINI_MODEL` defaults to `gemini-2.5-flash`; `AI_MAX_AGENT_STEPS`, `AI_MAX_MESSAGE_LENGTH`, `AI_MAX_HISTORY_MESSAGES`, and `AI_REQUEST_TIMEOUT_MS` are configurable limits.

If Gemini is unavailable, the assistant falls back to deterministic recommendations and the rest of the Career Guide remains usable. Conversation context is bounded in memory per authenticated user and conversation ID; hidden reasoning and credentials are never stored.

Run the backend with `npm run dev` from `backend/` and the frontend with `npm run dev` from `frontend/`. Validate with `npm run typecheck` and `npm test` in `backend/`, plus `npm run typecheck` and `npm run build` in `frontend/`.
# AI Career Guide

An intelligent career planning and guidance platform designed to help students and learners discover career paths matching their interests and skills, conduct grounded skill-gap analysis, and generate structured, actionable learning roadmaps.

---

## Current Development Phase

**MVP status: End-to-end foundation complete**
- Authentication with protected sessions, profile management, and career assessment
- Deterministic career matching and skill-gap analysis from the seeded knowledge base
- Career Guide Agent orchestration with personalized deterministic roadmaps
- Database-backed learning resources, project recommendations, saved careers, and student dashboard

**Phase 1: Project Foundation**
- Modular repository structure (`backend/`, `frontend/`, `docs/`)
- Express + TypeScript backend configured with CORS, JSON parsing, cookie parsing, Zod environment validation, and centralized error handling
- React 18 + Vite + TypeScript + Tailwind CSS frontend with React Query integration
- Clean health-check endpoint (`/api/health`) and basic environment configuration template (`.env.example`)
- Monorepo orchestration scripts for concurrent development and type verification
**Phase 2: Database & Prisma (Completed)**
- PostgreSQL Prisma ORM configuration with schema at `prisma/schema.prisma`
- 19 comprehensive domain models covering Users, Profiles, Skills, Careers, Roadmaps, Resources, Assessments, and AgentRuns
- Domain constraints: Foreign keys, 1:1, 1:N, M:N relations, cascade rules, compound unique indexes
- Baseline seed script (`prisma/seed.ts`) covering 12 baseline careers, realistic skills, interests, and verified resource links
- Standard Prisma workflow scripts (`prisma:generate`, `prisma:migrate`, `prisma:seed`, `prisma:studio`)
- Shared singleton client in `backend/src/lib/prisma.ts`

---

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **State Management & Data Fetching**: TanStack React Query v5, Zustand
- **Icons & Utilities**: Lucide React, clsx, tailwind-merge

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Utilities**: CORS, Cookie-Parser, Dotenv, tsx (dev runner)

### Architecture & Documentation
- **Architecture**: Modular Monolith following [docs/SDD.md](docs/SDD.md)
- **Data Layer**: PostgreSQL with Prisma ORM
- **Guidance Layer**: Deterministic matching, skill-gap, roadmap, resource, and project tools orchestrated by the Career Guide Agent

---

## Project Structure

```text
AI-Career-Guide/
├── backend/
│   ├── src/                    # Routes, controllers, services, tools, and tests
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/                    # Auth, profile, assessment, matching, roadmap, and dashboard UI
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   └── SDD.md                  # Software Design Document (Source of Truth)
│
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── package.json                # Root monorepo scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended; v20+ supported)
- npm (v9 or higher)

### 1. Install Dependencies

Install root, backend, and frontend dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in the root (or `backend/.env`):

```bash
cp .env.example .env
```

Set `DATABASE_URL` and a JWT secret of at least 32 characters in `.env`. Keep `.env` local; it is ignored by Git.

### 3. Run Development Servers

Run both the backend and frontend concurrently:

```bash
npm run dev
```

Or run them individually:

- **Backend API**: `npm run dev:backend` (runs on `http://localhost:5000`)
- **Frontend App**: `npm run dev:frontend` (runs on `http://localhost:5173`)

### 4. Health Check

Verify that the backend is responding:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "ai-career-guide-backend",
  "environment": "development"
}
```

### 4. Database & Prisma Commands
With PostgreSQL running and `DATABASE_URL` set:
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Seed baseline careers, skills, interests & resources
npm run prisma:seed

# Launch Prisma Studio database GUI
npm run prisma:studio
```

### 5. Type Checking, Tests & Production Build

Verify TypeScript compilation:

```bash
npm run typecheck

# Backend tests
npm --prefix backend test
```

Build for production:

```bash
npm run build
```

---

## Development Guidelines

- Follow the architecture and layering rules defined in [docs/SDD.md](docs/SDD.md).
- Do not commit secrets or `.env` files to version control.
- Keep business logic in services and database queries in repositories.
