# Execution lifecycle

| Status | Meaning |
|--------|---------|
| `QUEUED` | Persisted, job enqueued |
| `RUNNING` | Worker claimed, Docker started |
| `ACCEPTED` | Exit code 0 |
| `RUNTIME_ERROR` | Non-zero exit after compile |
| `COMPILATION_ERROR` | g++/javac failed (exit 2) |
| `TIME_LIMIT_EXCEEDED` | timeout / 124 / 137 |
| `INTERNAL_ERROR` | Worker/Docker failure or stale recovery |
| `WRONG_ANSWER` | Reserved for future testcase judge |

## Retries

BullMQ retries failed jobs (default 3, exponential backoff). After final failure → `INTERNAL_ERROR` + dead-letter log.

## Stale recovery

On worker startup, `RUNNING` rows older than `COMPILER_STALE_RUNNING_MS` → `INTERNAL_ERROR`.

## Language notes

- **JavaScript / Python**: file `main.js` / `main.py`, stdin from `input.txt`
- **C++**: `main.cpp` → compile → `./main`
- **Java**: `public class Main` in `Main.java` required
