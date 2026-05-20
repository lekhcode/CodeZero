/**
 * PM2 — run from this repository root after a production build.
 *
 *   npm ci
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 status
 *   pm2 save
 *   pm2 startup   # run the printed command once on the server
 *
 * After code/env changes:
 *   npm run build && pm2 restart ecosystem.config.cjs
 *
 * Prerequisites (same machine or reachable URLs in `.env`):
 *   - PostgreSQL (DATABASE_URL)
 *   - Redis (REDIS_URL) — e.g. docker compose -f docker-compose.compiler.yml up -d
 *   - Docker CLI for the compiler worker (code execution)
 *
 * Keep codezero-api at instances: 1 so the daily POTD cron runs only once.
 */
const path = require("path");

const rootDir = __dirname;

module.exports = {
  apps: [
    {
      name: "codezero-api",
      script: "dist/server.js",
      cwd: rootDir,
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      time: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "codezero-compiler-worker",
      script: "dist/compiler/workers/bootstrap.js",
      cwd: rootDir,
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      time: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
