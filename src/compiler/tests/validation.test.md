# Compiler manual test checklist

1. `POST /api/v1/compiler/run` with `{ "language": "javascript", "code": "console.log('hi')" }`
2. Poll `GET /api/v1/compiler/submissions/:id` until `ACCEPTED`
3. Python infinite loop → `TIME_LIMIT_EXCEEDED`
4. C++ syntax error → `COMPILATION_ERROR`
5. Stop worker mid-job → restart → stale recovery marks `INTERNAL_ERROR`

Automated tests can be added with Vitest + testcontainers (Redis) in a follow-up.
