# CodeZero Interviewer Runtime

Modular, local AI coding interviewer (Python). SOLID / hexagonal layout: domain + application do not depend on Ollama, Whisper, or Piper.

## Phase 1 (current)

- Interview state machine
- Context store + intervention policy
- Ollama LLM adapter (`qwen3:4b-instruct` default)
- Text-only smoke CLI
- Unit tests

Voice (STT/VAD/TTS), Express bridge, and UI strip come in later phases.

## Hardware note (this machine)

Measured on RTX 3050 4 GB + Ollama 0.40.3:

| Model | Processor | Approx VRAM |
|-------|-----------|-------------|
| `qwen3:4b-instruct` | ~76% GPU / 24% CPU | ~2.3 GB |
| `llama3.1:8b` (smoke only) | ~42% GPU / 58% CPU | ~2.3 GB |

CUDA Toolkit is **not** required for Ollama inference.

## Setup

```bash
cd interviewer
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -e ".[dev]"
```

Ensure Ollama is running and the model is pulled:

```bash
ollama pull qwen3:4b-instruct
```

## Smoke test (text)

```bash
codezero-interviewer-smoke
# or:
python -m codezero_interviewer.cli.smoke
```

## HTTP API (Express bridge)

```bash
pip install -e ".[api,dev]"
codezero-interviewer-serve
# listens on http://127.0.0.1:8100
```

Express proxies (auth required for sessions):

- `GET /api/v1/interviewer/health`
- `POST /api/v1/interviewer/sessions` `{ slug, mode? }`
- `POST /api/v1/interviewer/sessions/:id/events` `{ type, payload? }`

Optional env on the Node API: `INTERVIEWER_RUNTIME_URL=http://127.0.0.1:8100`

## Tests

```bash
pytest -q
```

## Layout

```text
src/codezero_interviewer/
  domain/          # entities, events, enums (pure)
  application/     # orchestrator, FSM, policy, context
  ports/           # ABC interfaces
  adapters/        # Ollama, in-memory bus, null voice stubs
  infrastructure/  # config, logging
  cli/             # smoke tools
```
