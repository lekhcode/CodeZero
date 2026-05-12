/**
 * Vertical feature slices (auth, problems, schedules, analytics, …) live under `modules/`.
 *
 * Suggested pattern at scale:
 * - `modules/<feature>/routes.ts` — Express router
 * - `modules/<feature>/service.ts` — DB + domain rules
 * - `modules/<feature>/types.ts` — DTOs / shared types
 *
 * Mount routers from `src/routes/index.ts` to keep HTTP wiring in one place.
 */
export {};
