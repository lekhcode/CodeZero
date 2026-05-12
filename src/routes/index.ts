import { Router } from "express";
import { rootRouter } from "./health.routes.js";

/**
 * Aggregates routers so `app.ts` stays small as the API grows.
 * Next step: add `problemsRouter`, `schedulesRouter`, etc., and mount them here.
 */
export const routes = Router();

routes.use(rootRouter);
