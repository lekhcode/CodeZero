/**
 * Vertical feature slices (auth, users, schedules, analytics, AI, revision, MCP, …) live under `modules/`.
 *
 * Suggested pattern at scale:
 * - `modules/<feature>/<feature>.routes.ts` — Express router
 * - `modules/<feature>/<feature>.service.ts` — DB + domain rules (no `req`/`res`)
 * - `modules/<feature>/<feature>.controller.ts` — HTTP adapter
 * - `modules/<feature>/<feature>.validation.ts` — Zod schemas
 *
 * Mount routers from `src/routes/index.ts` to keep HTTP wiring in one place.
 */
export { assignmentsRouter } from "./assignments/assignments.routes.js";
export { authRouter } from "./auth/auth.routes.js";
export { leetcodeRouter, problemsRouter } from "./leetcode/leetcode.routes.js";
export { scheduleTemplatesRouter } from "./scheduleTemplates/scheduleTemplates.routes.js";
export { userSchedulesRouter } from "./userSchedules/userSchedules.routes.js";
export { usersRouter } from "./users/users.routes.js";
