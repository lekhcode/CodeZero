import { Router } from "express";
import { assignmentsRouter } from "../modules/assignments/assignments.routes.js";
import { userAssignmentsRouter } from "../modules/assignments/userAssignments.routes.js";
import { submissionsRouter } from "../modules/submissions/submissions.routes.js";
import { plansRouter } from "../modules/plans/plans.routes.js";
import { leetcodeRouter, problemsRouter } from "../modules/leetcode/leetcode.routes.js";
import { scheduleTemplatesRouter } from "../modules/scheduleTemplates/scheduleTemplates.routes.js";
import { userSchedulesRouter } from "../modules/userSchedules/userSchedules.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";
import { compilerRouter } from "../compiler/api/compiler.routes.js";
import { problemByIdAdminRouter } from "../compiler/api/adminJudge.routes.js";
import { judgePollRouter } from "../compiler/api/judgePoll.routes.js";
import { rootRouter } from "./health.routes.js";

/**
 * Aggregates routers so `app.ts` stays small as the API grows.
 *
 * Versioned HTTP surface (`/api/v1/...`) lives here so adding schedules, analytics, AI, or MCP
 * proxies later is mostly "new module router + one line mount" without touching middleware order.
 */
export const routes = Router();

const apiV1 = Router();
apiV1.use("/auth", authRouter);
apiV1.use("/users", usersRouter);
apiV1.use("/users/me/assignments", userAssignmentsRouter);
apiV1.use("/submissions", submissionsRouter);
apiV1.use("/schedule-templates", scheduleTemplatesRouter);
apiV1.use("/user-schedules", userSchedulesRouter);
apiV1.use("/assignments", assignmentsRouter);
apiV1.use("/plans", plansRouter);
apiV1.use("/daily-problem", leetcodeRouter);
apiV1.use("/problems", problemsRouter);
apiV1.use("/problems/by-id", problemByIdAdminRouter);
apiV1.use("/judge", judgePollRouter);
apiV1.use("/compiler", compilerRouter);

routes.use("/api/v1", apiV1);
routes.use(rootRouter);
