# Architecture

## Flow

```
Client → POST /compiler/run
       → Prisma (status=QUEUED)
       → BullMQ job
       → 202/201 { submissionId }

Worker → pick job
       → status=RUNNING
       → Docker sandbox (compile + run)
       → status=ACCEPTED | RUNTIME_ERROR | ...
       → persist stdout/stderr

Client → GET /compiler/submissions/:id (poll)
```

## Module layout

| Folder | Responsibility |
|--------|----------------|
| `api/` | HTTP only — enqueue, never execute |
| `queue/` | BullMQ + Redis connection |
| `workers/` | Job consumers (separate process) |
| `docker/` | Secure `docker run` argument builder |
| `sandbox/` | Workspace lifecycle + executor |
| `services/` | DB + orchestration |
| `constants/` | Language images + scripts |

## Isolation from existing backend

- Separate Prisma model: `CompilerSubmission` → table `compiler_submissions`
- Router mounted at `/api/v1/compiler` only
- No imports from `assignments`, `leetcode`, or `auth` services (optional auth middleware only)

## Future-ready (not implemented)

- Hidden test cases → extend worker to compare outputs → `WRONG_ANSWER`
- K8s: run workers as Deployments, HPA on queue depth
- Firecracker: replace `docker run` with microVM API behind same `sandbox/executor` interface
- Contests: priority queues + rate limits per contest id
