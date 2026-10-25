import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

type RuntimeJson = Record<string, unknown>;

async function runtimeFetch(
  path: string,
  init?: RequestInit,
): Promise<RuntimeJson> {
  const base = env.INTERVIEWER_RUNTIME_URL.replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(env.INTERVIEWER_RUNTIME_TIMEOUT_MS),
    });
  } catch {
    throw ApiError.serviceUnavailable(
      `Interviewer runtime unreachable at ${base}. Start it with: codezero-interviewer-serve`,
    );
  }

  const text = await res.text();
  let body: RuntimeJson = {};
  if (text !== "") {
    try {
      body = JSON.parse(text) as RuntimeJson;
    } catch {
      body = { raw: text };
    }
  }

  if (!res.ok) {
    const detail =
      typeof body["detail"] === "string"
        ? body["detail"]
        : `Interviewer runtime error (${res.status})`;
    if (res.status === 404) throw ApiError.notFound(detail);
    if (res.status === 400) throw ApiError.badRequest(detail);
    throw new ApiError(502, detail, { code: "BAD_GATEWAY" });
  }

  return body;
}

export const interviewerRuntimeClient = {
  health() {
    return runtimeFetch("/health");
  },

  createSession(payload: RuntimeJson) {
    return runtimeFetch("/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  postEvent(sessionId: string, payload: RuntimeJson) {
    return runtimeFetch(`/sessions/${encodeURIComponent(sessionId)}/events`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Raw SSE Response from Python runtime (caller pipes to Express client). */
  async postEventStream(sessionId: string, payload: RuntimeJson): Promise<Response> {
    const base = env.INTERVIEWER_RUNTIME_URL.replace(/\/$/, "");
    let res: Response;
    try {
      res = await fetch(`${base}/sessions/${encodeURIComponent(sessionId)}/events/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        // Streaming turns can exceed the short HTTP timeout used for JSON posts.
        signal: AbortSignal.timeout(Math.max(env.INTERVIEWER_RUNTIME_TIMEOUT_MS, 180_000)),
      });
    } catch {
      throw ApiError.serviceUnavailable(
        `Interviewer runtime unreachable at ${base}. Start it with: codezero-interviewer-serve`,
      );
    }
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new ApiError(502, text || `Interviewer stream error (${res.status})`, {
        code: "BAD_GATEWAY",
      });
    }
    return res;
  },

  getSession(sessionId: string) {
    return runtimeFetch(`/sessions/${encodeURIComponent(sessionId)}`);
  },

  restoreSession(sessionId: string) {
    return runtimeFetch(`/sessions/${encodeURIComponent(sessionId)}/restore`, {
      method: "POST",
      body: "{}",
    });
  },

  voiceProfile() {
    return runtimeFetch("/voice/profile");
  },

  /** Binary TTS from Python Edge runtime (caller streams bytes to client). */
  async synthesizeTts(payload: {
    text: string;
    voice?: string;
    tone?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }): Promise<Response> {
    const base = env.INTERVIEWER_RUNTIME_URL.replace(/\/$/, "");
    let res: Response;
    try {
      res = await fetch(`${base}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(Math.max(env.INTERVIEWER_RUNTIME_TIMEOUT_MS, 15_000)),
      });
    } catch {
      throw ApiError.serviceUnavailable(
        `Interviewer runtime unreachable at ${base}. Start it with: codezero-interviewer-serve`,
      );
    }
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      if (res.status === 504) {
        throw new ApiError(504, text || "TTS timed out", { code: "TTS_TIMEOUT" });
      }
      throw new ApiError(502, text || `TTS error (${res.status})`, { code: "BAD_GATEWAY" });
    }
    return res;
  },
};
