# CodeZero Backend

**Schedule-driven DSA infrastructure — not a tutorial API.**

CodeZero’s backend powers a structured data-structures-and-algorithms training ecosystem: daily problem generation, template-based study plans, spaced-repetition revision, progress tracking, and a production-grade code execution plane. The system is built as an intentional platform layer — modular domains, versioned HTTP boundaries, and relational models that encode product semantics instead of generic CRUD rows.

---

## Backend philosophy

The API is the contract between learning workflows and persistence. Every major product concept — enrollment in a schedule, a calendar-day assignment, a revision task, a judge verdict — maps to explicit schema and service boundaries. Handlers stay thin; validation and errors are centralized; long-running or unsafe work (code execution) is isolated behind queues and separate processes.

Design priorities:

- **Extensibility** — new capabilities mount as modules under `/api/v1` without reshaping `app.ts`
- **Correctness** — schedule types, assignment status, and revision calendars are first-class enums, not stringly-typed flags
- **Production posture** — fail-fast env validation, structured logging, graceful shutdown, deploy scripts that verify build artifacts before restart
- **Developer experience** — TypeScript throughout, Zod at the edge, Prisma as a single schema source of truth

---

## System architecture

```
                    ┌─────────────────────────────────────────┐
                    │  Edge: Nginx + Cloudflare (TLS, CDN)   │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │  codezero-api (Express 5, PM2)          │
                    │  CORS → pino-http → /api/v1 routers     │
                    └──────┬────────────────────┬─────────────┘
                           │                    │
              ┌────────────▼────────────┐   ┌───▼──────────────────┐
              │  PostgreSQL (Prisma)     │   │  Redis + BullMQ       │
              │  schedules, users,       │   │  codezero-compiler-   │
              │  assignments, judge      │   │  worker (Docker)      │
              └─────────────────────────┘   └───────────────────────┘
```

### Layering

| Layer | Role |
|--------|------|
| **`server.ts`** | Process entry: listen, cron registration, SIGINT/SIGTERM → Prisma disconnect |
| **`app.ts`** | HTTP factory: middleware order only — no feature logic |
| **`routes/index.ts`** | Versioned surface (`/api/v1/*`) — one import per domain router |
| **`modules/*`** | Feature verticals: routes → validation → controller → service |
| **`middleware/*`** | Cross-cutting: auth, CORS, Zod validation, centralized errors |
| **`config/*`** | Env, JWT, Prisma, logger — validated at boot |
| **`compiler/*`** | Isolated execution domain: API enqueues, worker executes in Docker |
| **`jobs/*`** | In-process cron (e.g. daily LeetCode POTD sync) |

### Modular boundaries

Domains do not share implementation details across package lines. The compiler subsystem owns `CompilerSubmission` / `JudgeSubmission`, BullMQ, and sandbox lifecycle; scheduling owns `ScheduleTemplate`, `UserSchedule`, and `Assignment`; auth owns tokens and OAuth pending registration. Optional auth middleware is the only deliberate coupling at the HTTP edge.

Adding a new product area is deliberately boring: implement `modules/<feature>/`, export a router, add one line to `routes/index.ts`. Middleware order and error formatting never move.

---

## Authentication system

Identity is multi-provider and session-aware — built for real accounts, not demo logins.

### JWT access tokens

- Signed with `JWT_SECRET`; expiry configured via `JWT_EXPIRES_IN`
- **`requireAuth`** verifies signature, loads the user from the database (revoked users fail immediately), and enforces **single active session**: the raw Bearer token must match `User.currentAccessToken` (constant-time compare). A new login invalidates prior tokens without a separate refresh-token table.
- Email/password users must have `isEmailVerified` before protected routes succeed (`403` + `EMAIL_NOT_VERIFIED`)

### OAuth

- **Google** — ID token verified server-side (`google-auth-library`); profile linked on `googleId`
- **GitHub** — authorization code flow with redirect allowlist (dev ports + production frontend URL)
- **Pending registration** — unknown OAuth emails receive a short-lived `pendingToken` (signed payload) and complete via `POST /oauth/complete-registration` with username/profile fields — no orphan OAuth rows without explicit enrollment

### Email OTP

Hashed OTP rows (`EmailOtp`) support:

- verify email on signup
- forgot / reset password
- change password (authenticated)

Guards include resend cooldown, hourly rate limits, attempt tracking, and Resend delivery (with dev console fallback). OTPs are never stored in plaintext.

### Onboarding & walkthrough

`firstTimeLogin` on `User` drives first-run product walkthrough state; cleared after skip/finish. The production deploy script asserts the built artifact exposes this field — deploys fail fast if the API build is stale.

### Session lifecycle

`POST /logout` clears `currentAccessToken`. Login and OAuth success paths call `establishUserSession` to mint JWT and persist it as the sole valid session.

---

## Database design

**PostgreSQL** via **Prisma 7**. UUID primary keys everywhere — merge-friendly identifiers that stay stable across exports, sharding experiments, and multi-region ideas later.

### Schema philosophy

- **Normalized catalog** — `Problem` stores parsed LeetCode metadata; raw HTML is persisted for re-parsing but never exposed on public APIs
- **Template vs enrollment** — `ScheduleTemplate` (catalog: POTD, study plans, future topic pools) vs `UserSchedule` (per-user knobs: `dailyQuestions`, `difficulty`, `difficultyFilters`)
- **Assignments as progress truth** — one row per `(user, schedule, problem, calendar day)` with `AssignmentStatus` (`PENDING` | `SOLVED` | `MISSED` | `SKIPPED`), linked to accepted judge submissions when solved
- **Revision as separate domains** — `BrainCachePlaylist` / `BrainCacheRevisionTask` (user-defined spaced repetition) and `AutoRevision` (daily/weekly/monthly smart schedules from solves, timezone-aware)
- **Execution persistence** — `JudgeSubmission` with per-testcase JSON results and timing breakdown fields for observability

Indexes align with access paths: user + assigned date, user + revision due date, forum feeds, submission history.

Migrations are versioned under `prisma/migrations/`; production deploy runs `prisma migrate deploy` before PM2 restart.

---

## Scheduling engine

Practice is **schedule-driven**, not “fetch random problems.”

### Schedule types

| `ScheduleType` | Behavior |
|----------------|----------|
| `DAILY_POTD` | Today’s problem from `daily_potd` (synced from LeetCode; cron + `GET /daily-problem`) |
| `STUDY_PLAN` | Ordered `TemplateProblem` rows; daily window via `sliceStudyPlanForDay` from enrollment `createdAt` |
| `TOPIC` | Reserved; API returns `pending` until topic pools ship |

### Per-user knobs

- `dailyQuestions` and template `defaultCount` control batch size
- `difficulty` + `difficultyFilters` narrow study-plan problems before slicing
- Unique `(userId, templateId)` prevents duplicate enrollments

### Daily generation & tracking

1. **`getTodayAssignmentsForUser`** resolves what should be practiced today (POTD slot, study-plan slice, status: `ready` | `unavailable` | `completed`)
2. **`syncTodayAssignments`** materializes rows into `assignments` for the UTC calendar day
3. **`getTrackedTodayAssignments`** returns persisted assignments + learning stats; overdue logic refreshes stale `PENDING` rows

Accepted full judge runs mark assignments `SOLVED` and feed streaks, leaderboards, and auto-revision scheduling.

### Revision workflows

- **Brain Cache** — playlists with `revisionIntervalDays` and optional custom dates; tasks transition `PENDING` → `DUE` → `OVERDUE` → `COMPLETED`
- **Auto Revision** — on solve, `computeRevisionSchedules` schedules daily (+1 day), weekly (weekend anchor), and monthly (month-end) revisits in the user’s IANA timezone
- **Due calendar** — aggregates due work across schedules and revision systems for a single “what’s due” surface

---

## Performance & reliability

- **Targeted queries** — services fetch only needed relations (`select` / `include` scoped per endpoint); study-plan problems are grouped in one query per template set
- **Idempotent sync** — daily POTD upserts; in-flight guard prevents overlapping cron runs
- **Async execution** — judge/compiler work returns submission IDs; clients poll — API threads never block on Docker
- **Payload limits** — `express.json({ limit: "1mb" })` at the edge
- **Structured logs** — Pino (pretty in dev, JSON in prod) with request auto-logging via `pino-http`
- **Process supervision** — PM2 restarts API and compiler worker independently; API pinned to **one instance** so POTD cron does not duplicate

---

## Error handling

Errors funnel through a single **`errorHandler`**:

- **`ApiError`** — stable HTTP status, optional `code`, validation `details[]` for field-level clients
- **`HttpError`** — legacy compatibility
- **500s** — logged with context; stack traces only outside production

Route handlers use `asyncHandler` and `next(err)` — no duplicated `res.status().json` blocks. Validation middleware maps **Zod** failures to `422 VALIDATION_ERROR` before controllers run.

This is defensive API design: invalid input never reaches business logic; domain code throws semantic errors (`CONFLICT`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`) that clients can branch on.

---

## Production infrastructure

| Component | Why it matters |
|-----------|----------------|
| **AWS (VPS / EC2)** | Hosts the Node processes, PostgreSQL, and Redis; `scripts/deploy-production.sh` automates pull → `npm ci` → migrate → build → PM2 restart with a build sanity check |
| **Nginx** | TLS termination, reverse proxy to the API port, static asset separation from the Vite frontend, request size/timeouts at the edge |
| **PM2** | Keeps `codezero-api` and `codezero-compiler-worker` alive across crashes and deploys; memory restart caps; `pm2 save` / startup for reboot survival |
| **PostgreSQL** | ACID progress, assignments, and auth state — the system of record |
| **Redis** | BullMQ backing store for isolated code execution jobs |
| **Cloudflare** | DNS, CDN, and edge protection in front of Nginx — reduces origin load and adds WAF/DDoS mitigation without changing application code |
| **Docker** | Compiler worker runs user code in constrained containers (`memory`, `cpus`, `pids` limits from env) |

Graceful shutdown on `SIGINT`/`SIGTERM` closes the HTTP server and disconnects Prisma before exit.

---

## Security thinking

- **Auth** — bcrypt for passwords; OAuth secrets and JWT signing keys from env only; GitHub redirect URI allowlist
- **Session** — stolen old tokens fail `currentAccessToken` check; email verification gate for local accounts
- **OTP** — hashed at rest; rate limits on resend and hourly volume
- **CORS** — explicit allowlist (`CORS_ORIGIN`, `FRONTEND_URL`); blocked origins logged
- **Execution** — user code never runs in the API process; queue + worker + Docker sandbox
- **Dump/admin routes** — optional `x-leetcode-dump-token` or JWT for catalog ingestion
- **Env isolation** — `config/env.ts` fails fast on missing `DATABASE_URL` / `JWT_SECRET`; production vs dev GitHub OAuth credential resolution
- **Fingerprinting** — `x-powered-by` disabled

---

## Tech stack

| Technology | Why |
|------------|-----|
| **Node 20+ / TypeScript** | Typed contracts across modules; ESM-native toolchain |
| **Express 5** | Mature middleware model; thin HTTP layer |
| **Prisma 7 + PostgreSQL** | Migrations, type-safe queries, schema as documentation |
| **Zod 4** | Runtime validation aligned with TypeScript types at route boundaries |
| **jsonwebtoken** | Stateless access tokens with DB-backed session invalidation |
| **BullMQ + Redis** | Reliable job queue for compiler/judge workers |
| **Pino** | Low-overhead structured logging for production triage |
| **node-cron** | Scheduled POTD sync without a separate scheduler service (single API instance) |
| **Resend** | Transactional OTP email delivery |
| **Docker** | Sandboxed multi-language compile/run with resource caps |

---

## API design philosophy

- **Versioned REST** — all product routes under `/api/v1`
- **Resource-oriented paths** — `/user-schedules`, `/schedule-templates`, `/brain-cache`, `/auto-revisions`, `/submissions`
- **Consistent envelopes** — success via `ApiResponse` helpers; errors via `ApiError` → middleware
- **Validation at the edge** — `validateBody` / `validateParams` / `validateQuery` (Express 5–safe `validatedQuery`)
- **Expansion without churn** — forum, leaderboard, learning insights, LeetCode catalog dump, and compiler judge poll endpoints coexist without a monolithic router file

Representative surface (see `src/routes/index.ts`):

```
/api/v1/auth
/api/v1/users
/api/v1/user-schedules
/api/v1/schedule-templates
/api/v1/assignments
/api/v1/submissions
/api/v1/daily-problem
/api/v1/problems
/api/v1/judge
/api/v1/compiler
/api/v1/brain-cache
/api/v1/auto-revisions
/api/v1/due-calendar
/api/v1/forum
```

---

## Developer experience

- **Module colocation** — each feature folder owns routes, validation, controller, service, and types
- **`createApp()` factory** — testable HTTP app without binding a port
- **`asyncHandler`** — Promise rejections reach the error middleware
- **Scripts** — `db:migrate`, `db:seed`, study-plan sync (`sync:blind-75`, etc.), targeted tests under `npm run test:*`
- **Compiler docs** — `src/compiler/docs/architecture.md` documents the execution lifecycle separately from scheduling docs in code comments

The goal is that a new engineer adds a feature by copying an existing module’s shape, not by reading a framework manual.

---

## Why this backend stands out

This is **not** a weekend Express CRUD demo.

| Typical tutorial API | CodeZero backend |
|----------------------|------------------|
| `users` + `posts` tables | Schedule templates, enrollments, calendar assignments, revision tasks |
| Login returns JWT, done | Single-session JWT + OAuth pending flow + OTP lifecycle |
| “Run code” in `eval` | Queue → worker → Docker with judge testcases and timing telemetry |
| One `routes.js` file | Dozen domain modules behind `/api/v1` |
| String dates in JSON | Timezone-aware revision scheduling (`Intl`, IANA zones) |
| No deploy story | PM2 dual-process, migrate-before-restart, build verification |

The depth is in **domain modeling**: progress is tracked per schedule per day; study plans advance by deterministic day index; spaced repetition is a first-class schema, not a frontend-only hack. That modeling is what makes analytics, AI scheduling, and adaptive engines possible later without rewriting the core.

---

## Future system evolution

Natural extensions on the current architecture:

- **AI-driven scheduling** — new `ScheduleTemplate` types with model-generated `TemplateProblem` ordering; same enrollment/assignment pipeline
- **Adaptive learning** — difficulty and topic selection informed by submission history and `UserProblemSolve` graphs
- **Analytics plane** — read replicas or event export from assignment/judge transitions (already rich timestamps and statuses)
- **Distributed workers** — horizontal compiler workers (HPA on queue depth); API remains stateless except cron leader election
- **Intelligent revision prioritization** — rank `BrainCacheRevisionTask` / `AutoRevision` by failure mode, time since solve, and contest proximity

The schema and module boundaries are already shaped for these paths — they are not bolt-on fantasies.

---

## Quick start (local)

**Prerequisites:** Node 20+, PostgreSQL, Redis, Docker (for compiler worker).

```bash
cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, etc.
npm install
docker compose -f docker-compose.compiler.yml up -d
npm run db:migrate
npm run dev              # API
npm run compiler:worker  # second terminal
```

**Production (summary):**

```bash
npm ci && npm run db:migrate:deploy && npm run build
pm2 start ecosystem.config.cjs
```

Frontend lives in `frontend/` — see `frontend/README.md`.

---

## Related documentation

- `src/compiler/docs/architecture.md` — compiler queue, worker, sandbox isolation
- `src/compiler/docs/README.md` — execution system overview
- `.env.example` — full configuration surface

---

*CodeZero backend — engineered for structured practice, revision, and execution at production depth.*
