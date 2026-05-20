import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as plansController from "./plans.controller.js";

/** Study plan catalog endpoints (problem lists per template). */
export const plansRouter = Router();

plansRouter.get("/blind-75", asyncHandler(plansController.listBlind75));
plansRouter.get("/top-interview-150", asyncHandler(plansController.listTopInterview150));
plansRouter.get("/neetcode-150", asyncHandler(plansController.listNeetCode150));
