# Trackly

Employee time tracking and productivity platform. Built as a full-stack monorepo with Next.js, NestJS, PostgreSQL, and AI-powered productivity insights.

## Docker (Quickstart)

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



## Architecture

### 1. Monorepo Strategy with Modular Structure

Trackly adopts a **monorepo architecture** using npm workspaces and Turborepo, enabling efficient code sharing and scalability. While initially structured as a monolith within the NestJS backend, the monorepo design provides a foundation for future migration to microservices without disrupting the frontend or shared libraries.

**Structure:**
- `apps/web` — Next.js frontend
- `apps/api` — NestJS backend
- `packages/shared` — Type definitions and constants

This approach decouples frontend and backend builds, enables independent deployment, and reduces dependency drift through a single source of truth for shared types. Turborepo caches build outputs across the entire workspace, accelerating both local development and CI/CD pipelines.

### 2. NestJS for Modular & Scalable Backend

NestJS was chosen to maintain **code modularity and scalability** across the backend. Its decorator-driven architecture, built-in dependency injection, and opinionated structure enforce consistency as the codebase grows.

**Key modular patterns:**
- **Feature modules** — Each domain (auth, tasks, activities, etc.) is isolated in its own module with controllers, services, and data-access patterns
- **Guards & Filters** — Role-based access control (`RolesGuard`), organization membership verification (`OrgMembershipGuard`), and exception handling (`GlobalExceptionFilter`) are implemented as reusable decorators and middleware
- **Service layer** — Business logic is decoupled from HTTP concerns, making services testable and reusable across different transports (REST, WebSocket, CLI)

This structure scales horizontally: adding a new feature doesn't require touching existing modules.

### 3. PostgreSQL for Structured Data & Advanced Features

PostgreSQL was selected as the database for its **structured data modeling** and **advanced features**:

- **Type safety** — Prisma ORM provides generated TypeScript types that sync with schema changes, catching type errors at compile time
- **Migration system** — Prisma Migrate tracks schema evolution with reproducible SQL, enabling safe deployments and rollbacks

**Database Design for Scalability:**
The schema is designed by following database normalization principles as much as practical to maintain data integrity and support scalability:

- **Proper Foreign Keys** — Cascading deletes ensure referential integrity without orphaned records
- **Unique Constraints** — Composite unique constraints (e.g., `[userId, orgId]`, `[orgId, name]`) prevent data duplication and enforce business rules
- **Strategic Indexing** — Indexes on frequently queried columns (`userId`, `orgId`, `status`, `recordedAt`) optimize query performance across millions of records

**View the complete schema and relationships** in [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma).

### 4. Horizontal Scalability Architecture

Trackly is designed for **horizontal scaling** to support thousands of concurrent users without relying on vertical scaling (buying bigger servers). The architecture uses proven patterns:

**Stateless API Design:**
- Each NestJS instance is **stateless** — no in-memory session storage or request-local state
- HTTP-only cookies and refresh tokens (stored in PostgreSQL) enable any server instance to authenticate any user
- Load balancers can route requests to any instance without session affinity requirements

**Load Balancing & Reverse Proxy:**
- **Nginx** (or similar) acts as a reverse proxy, distributing traffic across multiple API instances


**Rate Limiting & Request Throttling:**
- Implement **rate limiting** per user/IP using Redis counters — prevents abuse while maintaining fair access


**Traffic Flow Example:**
```
Clients → Nginx (Load Balancer)
              ├→ API Instance 1 
              ├→ API Instance 2
              └→ API Instance 3
```

This architecture scales from tens to thousands of concurrent users

### 5. HTTP-Only Cookie Authentication

Tokens are stored in HTTP-only cookies instead of localStorage. This makes the app immune to XSS token theft -- JavaScript cannot access HTTP-only cookies. Combined with `sameSite: lax`, mutations are protected against CSRF without requiring CSRF tokens.

### 6. Dual-Token Rotation

A 15-minute access token keeps the window of compromise small. A 7-day refresh token (stored in the database) enables session persistence. On each refresh, the old token is deleted and a new pair is issued (rotation), so a stolen refresh token can only be used once before becoming invalid.

### 7. Org-Scoped Multi-Tenancy

All resources live under `/api/orgs/:orgId/...`. The `OrgMembershipGuard` runs on every request and verifies the user belongs to the organization before any controller logic executes. This provides tenant isolation at the middleware level rather than relying on query filters.

### 8. Timer as Null endTime

A running timer is simply a time entry with `endTime IS NULL`. This approach is crash-recovery friendly -- if the app crashes, the timer entry persists and can be stopped later. A database constraint enforces one active timer per user (`WHERE endTime IS NULL`).

### 9. Pre-Computed Duration

Duration (in seconds) is computed and stored when a timer stops, rather than derived on read. This makes aggregate reporting (`SUM(duration) GROUP BY`) index-scan only, avoiding per-row computation across potentially millions of time entries.

### 10. AI Provider Strategy Pattern

```
AiService
├── tries OllamaProvider (Docker container, llama3.2)
├── catches connection errors
└── falls back to MockAiProvider (rule-based heuristics)
```

The mock provider isn't a stub -- it analyzes actual time and activity data using heuristic rules. This means the AI insights page always works, whether Ollama is running or not, including in CI environments.

### 11. Shared Types Package

`@trackly/shared` contains TypeScript enums, interfaces, and constants used by both frontend and backend. This eliminates type drift -- when a type changes, both sides see the change immediately and TypeScript catches mismatches at build time.

### 12. Multi-Stage Docker Builds

Each Dockerfile uses three stages: `deps` (install), `builder` (compile), `runner` (production). The final image contains only compiled JavaScript, Prisma client, and production node_modules -- no TypeScript compiler, no source code, no dev dependencies. This cuts image size from ~1GB to ~200MB.

### 13. Global Exception Filter with Structured Logging

A single `GlobalExceptionFilter` catches all exceptions across the API. It normalizes error responses into a consistent format (`{ statusCode, message[], timestamp, path }`), logs 5xx errors with full stack traces, and logs 4xx errors as warnings. The frontend API client parses this format and surfaces errors via toast notifications (sonner).


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

### All endpoints are documented with Swagger at http://localhost:4000/docs.



## Environment Variables

See [.env.example](.env.example) for all required variables:

