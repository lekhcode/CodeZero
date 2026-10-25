import { randomUUID } from "node:crypto";
import * as leetcodeService from "../leetcode/leetcode.service.js";
import type { CreateSessionBody, PostEventBody } from "./interviewer.validation.js";
import { interviewerRuntimeClient } from "./interviewer.runtimeClient.js";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function health() {
  return interviewerRuntimeClient.health();
}

function firstNameFrom(full: string | null | undefined): string | undefined {
  const part = (full ?? "").trim().split(/\s+/)[0];
  return part || undefined;
}

export async function createSession(userId: string, body: CreateSessionBody) {
  const problem = await leetcodeService.getProblemBySlug(body.slug);
  const sessionId = randomUUID();
  const { prisma } = await import("../../config/prisma.js");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true },
  });
  const candidateFirstName =
    firstNameFrom(user?.name) ?? firstNameFrom(user?.username ?? undefined);

  const runtime = await interviewerRuntimeClient.createSession({
    session_id: sessionId,
    mode: body.mode,
    candidate_first_name: candidateFirstName ?? null,
    problem: {
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      statement: problem.statement,
      constraints: Array.isArray(problem.constraints)
        ? problem.constraints.join("\n")
        : String(problem.constraints ?? ""),
      examples: problem.examples ?? [],
      topics: problem.topics ?? [],
      language: body.language ?? null,
    },
  });

  return {
    sessionId: asString(runtime["sessionId"], sessionId),
    state: asString(runtime["state"], "QUESTION_OPEN"),
    uiState: asString(runtime["uiState"], "idle"),
    mode: asString(runtime["mode"], body.mode),
    userId,
    slug: problem.slug,
    title: problem.title,
  };
}

export async function postEvent(sessionId: string, body: PostEventBody) {
  const runtime = await interviewerRuntimeClient.postEvent(sessionId, {
    type: body.type,
    payload: body.payload ?? {},
  });
  return {
    sessionId: asString(runtime["sessionId"], sessionId),
    state: asString(runtime["state"]),
    uiState: asString(runtime["uiState"], "idle"),
    turnId: runtime["turnId"] ?? null,
    utterance: asString(runtime["utterance"]),
    decision: asString(runtime["decision"], "remain_silent"),
    cancelled: runtime["cancelled"] === true,
    latency: (runtime["latency"] as Record<string, unknown> | undefined) ?? {},
  };
}

export async function getSession(sessionId: string) {
  const runtime = await interviewerRuntimeClient.getSession(sessionId);
  return {
    sessionId: asString(runtime["sessionId"], sessionId),
    state: asString(runtime["state"]),
    uiState: asString(runtime["uiState"], "idle"),
    mode: asString(runtime["mode"], "standard"),
    problemSlug: asString(runtime["problemSlug"]),
    interviewStarted: runtime["interviewStarted"] === true,
    askedQuestions: Array.isArray(runtime["askedQuestions"])
      ? runtime["askedQuestions"]
      : [],
    topicsExplored: Array.isArray(runtime["topicsExplored"])
      ? runtime["topicsExplored"]
      : [],
  };
}

export async function restoreSession(sessionId: string) {
  const runtime = await interviewerRuntimeClient.restoreSession(sessionId);
  return {
    sessionId: asString(runtime["sessionId"], sessionId),
    state: asString(runtime["state"]),
    uiState: asString(runtime["uiState"], "idle"),
    mode: asString(runtime["mode"], "standard"),
    problemSlug: asString(runtime["problemSlug"]),
    interviewStarted: runtime["interviewStarted"] === true,
  };
}

export async function voiceProfile() {
  return interviewerRuntimeClient.voiceProfile();
}
