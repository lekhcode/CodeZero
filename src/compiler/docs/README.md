# CodeZero Compiler — Distributed Execution System

Isolated domain under `src/compiler/`. **Never executes user code in the Express API process.**

## Quick start

```bash
docker compose -f docker-compose.compiler.yml up -d
npm install
npm run db:migrate
npm run dev              # API
npm run compiler:worker  # separate terminal
```

Pull language images once:

```bash
docker pull node:20-alpine python:3.12-alpine gcc:14-bookworm eclipse-temurin:17-jdk-alpine
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/compiler/run` | Queue execution, returns `{ submissionId }` |
| GET | `/api/v1/compiler/submissions/:id` | Poll status + stdout/stderr |

See [architecture.md](./architecture.md), [security.md](./security.md), [scaling.md](./scaling.md).
