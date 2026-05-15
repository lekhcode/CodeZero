# Security

## Threat model

User-submitted code is **untrusted**. It must not:

- Access the host network
- Read secrets from the API server filesystem
- Exhaust host CPU/memory unbounded
- Spawn unbounded processes

## Controls

| Control | Implementation |
|---------|----------------|
| Process isolation | Docker container per run |
| Network | `--network none` |
| Memory | `--memory` (default 256m) |
| CPU | `--cpus` (default 0.5) |
| PIDs | `--pids-limit` |
| Filesystem | `--read-only` root + rw `/workspace` mount only |
| Time | `timeout` inside container + worker job timeout |
| Output size | Truncate before DB write |
| Code size | `COMPILER_MAX_CODE_BYTES` on API |

## What we do NOT do (yet)

- Seccomp/AppArmor custom profiles
- Firecracker microVMs
- AST-based static analysis

Migrate to stronger isolation without changing API contracts by swapping `sandbox/executor.ts` internals.
