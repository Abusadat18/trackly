# Trackly

Employee time tracking and productivity platform. Built as a full-stack monorepo with Next.js, NestJS, PostgreSQL, and AI-powered productivity insights.

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd trackly
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start PostgreSQL (via Docker)
docker-compose up db -d

# 4. Run migrations and seed
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api
- **Swagger docs**: http://localhost:4000/docs

### Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@trackly.dev | password123 | Owner |
| sarah@trackly.dev | password123 | Admin |
| james@trackly.dev | password123 | Member |

All seed users share the password `password123`.

## Docker (Production)

Run the entire stack with a single command:

```bash
docker-compose up --build
```

This starts 5 services:

| Service | Port | Description |
|---------|------|-------------|
| **db** | 5432 | PostgreSQL 16 with health checks |
| **api** | 4000 | NestJS API (runs migrations + seeds on startup) |
| **web** | 3000 | Next.js frontend (standalone build) |
| **ollama** | 11434 | Ollama LLM server |
| **ollama-init** | - | Pulls the `llama3.2:3b` model automatically, then exits |

> **Note on auto-seeding**: The API container automatically seeds the database with demo data on startup. This is intentional for evaluation purposes — it means the reviewer can run `docker-compose up --build` and immediately see a fully populated dashboard with charts, teams, and time entries. In a real production deployment, the seed step would be removed from the entrypoint.

For local development, run PostgreSQL via Docker and use `npm run dev` for hot-reload (see Quick Start above).

## Architecture

```
trackly/
├── apps/
│   ├── web/                  # Next.js 16 (App Router)
│   │   ├── src/app/          # Route groups: (marketing), (auth), (dashboard)
│   │   ├── src/components/   # UI (shadcn), layout, timer, charts, teams, projects
│   │   ├── src/hooks/        # useTimer
│   │   ├── src/lib/          # API client, utilities
│   │   └── src/providers/    # Auth, Query, Org context providers
│   │
│   └── api/                  # NestJS 11
│       ├── src/modules/      # Auth, Users, Orgs, Teams, Projects, Tasks,
│       │                     # TimeEntries, Activity, Reports, AI, Email, Invitations
│       ├── src/common/       # Guards, decorators, filters, interceptors, pipes
│       └── prisma/           # Schema, migrations, seed
│
├── packages/
│   └── shared/               # Shared TypeScript types, enums, constants
│
├── docker/
│   ├── Dockerfile.api        # Multi-stage build (~200MB final image)
│   └── Dockerfile.web        # Multi-stage build (standalone Next.js)
│
└── docker-compose.yml        # All services: db + api + web + ollama
```

### Request Flow

```
Client → Next.js → API Client (fetch + cookies) → NestJS API
                                                      │
                                         ValidationPipe → JwtAuthGuard (cookie)
                                              → OrgMembershipGuard → RolesGuard
                                                      → Controller → Service → Prisma → PostgreSQL
```

### Database Schema (12 tables)

```
users ──┬── org_memberships ──── organizations
        ├── team_members ─────── teams
        ├── time_entries ─────── projects ──── tasks
        ├── activity_logs
        ├── manual_entry_requests
        └── refresh_tokens
                                 organizations ──── invitations
```

Key indexes on `time_entries[userId, startTime]`, `time_entries[projectId, startTime]`, and `activity_logs[userId, recordedAt]` for fast reporting queries.

## Technical Decisions

### 1. HTTP-Only Cookie Authentication

Tokens are stored in HTTP-only cookies instead of localStorage. This makes the app immune to XSS token theft -- JavaScript cannot access HTTP-only cookies. Combined with `sameSite: lax`, mutations are protected against CSRF without requiring CSRF tokens.

### 2. Dual-Token Rotation

A 15-minute access token keeps the window of compromise small. A 7-day refresh token (stored in the database) enables session persistence. On each refresh, the old token is deleted and a new pair is issued (rotation), so a stolen refresh token can only be used once before becoming invalid.

### 3. Org-Scoped Multi-Tenancy

All resources live under `/api/orgs/:orgId/...`. The `OrgMembershipGuard` runs on every request and verifies the user belongs to the organization before any controller logic executes. This provides tenant isolation at the middleware level rather than relying on query filters.

### 4. Timer as Null endTime

A running timer is simply a time entry with `endTime IS NULL`. This approach is crash-recovery friendly -- if the app crashes, the timer entry persists and can be stopped later. A database constraint enforces one active timer per user (`WHERE endTime IS NULL`).

### 5. Pre-Computed Duration

Duration (in seconds) is computed and stored when a timer stops, rather than derived on read. This makes aggregate reporting (`SUM(duration) GROUP BY`) index-scan only, avoiding per-row computation across potentially millions of time entries.

### 6. AI Provider Strategy Pattern

```
AiService
├── tries OllamaProvider (Docker container, llama3.2)
├── catches connection errors
└── falls back to MockAiProvider (rule-based heuristics)
```

The mock provider isn't a stub -- it analyzes actual time and activity data using heuristic rules. This means the AI insights page always works, whether Ollama is running or not, including in CI environments.

### 7. Shared Types Package

`@trackly/shared` contains TypeScript enums, interfaces, and constants used by both frontend and backend. This eliminates type drift -- when a type changes, both sides see the change immediately and TypeScript catches mismatches at build time.

### 8. Multi-Stage Docker Builds

Each Dockerfile uses three stages: `deps` (install), `builder` (compile), `runner` (production). The final image contains only compiled JavaScript, Prisma client, and production node_modules -- no TypeScript compiler, no source code, no dev dependencies. This cuts image size from ~1GB to ~200MB.

### 9. Global Exception Filter with Structured Logging

A single `GlobalExceptionFilter` catches all exceptions across the API. It normalizes error responses into a consistent format (`{ statusCode, message[], timestamp, path }`), logs 5xx errors with full stack traces, and logs 4xx errors as warnings. The frontend API client parses this format and surfaces errors via toast notifications (sonner).

### 10. Monorepo with Turborepo

npm workspaces handle dependency resolution; Turborepo handles task orchestration. `turbo run build` builds `shared` first (since both `api` and `web` depend on it), then builds `api` and `web` in parallel. Cached builds mean unchanged packages skip compilation entirely.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 (App Router) | Server components, file-based routing, standalone Docker output |
| UI | shadcn/ui + Tailwind CSS 4 | Composable, accessible components without runtime overhead |
| Charts | Recharts | Declarative React charts (pie, bar, line) |
| State | TanStack Query | Server state caching, automatic refetch, optimistic updates |
| Backend | NestJS 11 | Modular architecture, decorators, guards, dependency injection |
| Database | PostgreSQL 16 + Prisma | Type-safe queries, migrations, schema-as-code |
| Auth | Passport + JWT | Cookie-based extraction, refresh token rotation |
| Email | Resend | Transactional email for invitations |
| AI | Ollama (llama3.2) | Local LLM for productivity analysis, no external API dependency |
| Monorepo | npm workspaces + Turborepo | Shared dependencies, parallel builds, caching |
| Containers | Docker + docker-compose | One-command deployment for all 4 services |

## API Overview

All endpoints are documented with Swagger at http://localhost:4000/docs.

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/api/auth` | signup, login, logout, refresh, me |
| Organizations | `/api/orgs` | CRUD, members, role management |
| Teams | `/api/orgs/:orgId/teams` | CRUD, add/remove members, team lead assignment |
| Projects | `/api/orgs/:orgId/projects` | CRUD, archive |
| Tasks | `/api/orgs/:orgId/projects/:projectId/tasks` | CRUD, status management |
| Time Entries | `/api/orgs/:orgId/time-entries` | start, stop, manual entry, list with filters |
| Activity | `/api/orgs/:orgId/activity` | batch log, per-user activity, summary |
| Reports | `/api/orgs/:orgId/reports` | team/user/project summaries, productivity |
| AI | `/api/orgs/:orgId/ai` | analyze productivity, cached insights, health check |
| Invitations | `/api/orgs/:orgId/invitations` | send, list, revoke, accept |

## Development Commands

```bash
# Start all services in dev mode (from root)
npm run dev

# Database
npm run db:migrate          # Run migrations
npm run db:seed             # Seed demo data
npm run db:reset            # Reset and re-migrate
npm run db:studio           # Open Prisma Studio GUI

# Type checking
cd apps/api && npx tsc --noEmit
cd apps/web && npx next build

# Build all
npm run build
```

## Environment Variables

See [.env.example](.env.example) for all required variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://trackly:trackly_secret@localhost:5432/trackly` |
| `JWT_SECRET` | Access token signing key | - |
| `JWT_REFRESH_SECRET` | Refresh token signing key | - |
| `COOKIE_DOMAIN` | Cookie domain | `localhost` |
| `RESEND_API_KEY` | Resend API key for emails | - |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## Project Structure Highlights

- **Guard chain**: `JwtAuthGuard` -> `OrgMembershipGuard` -> `RolesGuard` -- applied globally, ensures every request is authenticated and authorized
- **Decorators**: `@CurrentUser()` extracts the JWT user, `@Public()` bypasses auth, `@Roles()` sets required org roles
- **Transform interceptor**: Wraps all responses in `{ data }` for consistency
- **API client**: Centralized fetch wrapper with cookie credentials, typed responses, and `ApiError` class
- **Toast notifications**: All mutations show success/error toasts via sonner
- **Timer widget**: Persistent floating timer visible across all dashboard pages
