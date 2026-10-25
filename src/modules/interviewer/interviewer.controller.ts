import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import type { CreateSessionBody, PostEventBody } from "./interviewer.validation.js";
import { interviewerRuntimeClient } from "./interviewer.runtimeClient.js";
import * as interviewerService from "./interviewer.service.js";

function requireUserId(req: Request): string {
  const u = req.user;
  if (u === undefined) throw ApiError.unauthorized("Not authenticated");
  return u.id;
}

export async function health(_req: Request, res: Response): Promise<void> {
  const data = await interviewerService.health();
  ApiResponse.success(res, { runtime: data });
}

export async function createSession(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const body = req.body as CreateSessionBody;
  const session = await interviewerService.createSession(userId, body);
  ApiResponse.created(res, { session });
}

export async function postEvent(req: Request, res: Response): Promise<void> {
  requireUserId(req);
  const { sessionId } = req.params as { sessionId: string };
  const body = req.body as PostEventBody;
  const result = await interviewerService.postEvent(sessionId, body);
  ApiResponse.success(res, { result });
}

/** Proxies Python SSE so the browser can speak chunks before the full LLM reply. */
export async function postEventStream(req: Request, res: Response): Promise<void> {
  requireUserId(req);
  const { sessionId } = req.params as { sessionId: string };
  const body = req.body as PostEventBody;
  const upstream = await interviewerRuntimeClient.postEventStream(sessionId, {
    type: body.type,
    payload: body.payload ?? {},
  });

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const reader = upstream.body!.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
    res.end();
  }
}

export async function getSession(req: Request, res: Response): Promise<void> {
  requireUserId(req);
  const { sessionId } = req.params as { sessionId: string };
  const session = await interviewerService.getSession(sessionId);
  ApiResponse.success(res, { session });
}

export async function restoreSession(req: Request, res: Response): Promise<void> {
  requireUserId(req);
  const { sessionId } = req.params as { sessionId: string };
  const session = await interviewerService.restoreSession(sessionId);
  ApiResponse.success(res, { session });
}

export async function voiceProfile(_req: Request, res: Response): Promise<void> {
  const profile = await interviewerService.voiceProfile();
  ApiResponse.success(res, { profile });
}

/** Proxies Edge TTS audio/mpeg from the Python runtime. */
export async function synthesizeTts(req: Request, res: Response): Promise<void> {
  requireUserId(req);
  const body = req.body as {
    text?: string;
    voice?: string;
    tone?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  };
  if (!body.text?.trim()) {
    throw ApiError.badRequest("text required");
  }
  const upstream = await interviewerRuntimeClient.synthesizeTts({
    text: body.text,
    voice: body.voice,
    tone: body.tone ?? "neutral",
    rate: body.rate ?? 1,
    pitch: body.pitch ?? 1,
    volume: body.volume ?? 1,
  });

  res.status(200);
  res.setHeader(
    "Content-Type",
    upstream.headers.get("Content-Type") ?? "audio/mpeg",
  );
  const cached = upstream.headers.get("X-TTS-Cached");
  if (cached) res.setHeader("X-TTS-Cached", cached);
  const provider = upstream.headers.get("X-TTS-Provider");
  if (provider) res.setHeader("X-TTS-Provider", provider);
  const voice = upstream.headers.get("X-TTS-Voice");
  if (voice) res.setHeader("X-TTS-Voice", voice);
  res.setHeader("Cache-Control", upstream.headers.get("Cache-Control") ?? "no-store");

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.send(buf);
}
