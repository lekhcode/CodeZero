# CodeZero Frontend

AI-powered LeetCode learning UI — React + Vite + MUI (bright theme).

## Run locally

```bash
# Terminal 0 — Redis (repo root, once)
docker compose -f docker-compose.compiler.yml up -d

# Terminal 1 — API (repo root)
npm run dev

# Terminal 2 — compiler worker (repo root)
npm run compiler:worker

# Terminal 3 — frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API calls proxy to `http://localhost:2026` via Vite.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Environment

Copy `.env.example` to `.env` if you need a custom API host in production:

```
VITE_API_BASE_URL=https://your-api.example.com
```

Leave empty in development (uses `/api` proxy).

## Architecture

- `src/services/` — Axios + API modules
- `src/hooks/` — React Query + auth hooks
- `src/store/` — Zustand (auth session, UI shell)
- `src/pages/` — Route-level screens
- `src/components/` — Reusable UI
- `src/modules/` — Feature-specific UI (e.g. schedule modal)
