import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import * as dumpController from "./leetcode.dump.controller.js";
import { requireDumpAccess } from "./leetcode.dump.middleware.js";
import {
  dumpCatalogBodySchema,
  dumpDetailsBodySchema,
  dumpNeetCode150BodySchema,
} from "./leetcode.dump.validation.js";

/**
 * POST /api/v1/leetcode/dump/catalog — metadata-only upsert from LeetCode problem list.
 * POST /api/v1/leetcode/dump/details — full statement/examples sync (slow; rate-limited).
 * POST /api/v1/leetcode/dump/study-plan/neetcode-150 — fetch NeetCode 150 + sync template.
 */
export const leetcodeDumpRouter = Router();

leetcodeDumpRouter.post(
  "/catalog",
  requireDumpAccess,
  validateBody(dumpCatalogBodySchema),
  asyncHandler(dumpController.dumpCatalog),
);

leetcodeDumpRouter.post(
  "/details",
  requireDumpAccess,
  validateBody(dumpDetailsBodySchema),
  asyncHandler(dumpController.dumpDetails),
);

leetcodeDumpRouter.post(
  "/study-plan/neetcode-150",
  requireDumpAccess,
  validateBody(dumpNeetCode150BodySchema),
  asyncHandler(dumpController.dumpNeetCode150),
);
