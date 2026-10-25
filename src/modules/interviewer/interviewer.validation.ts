import { z } from "zod";

export const createSessionBodySchema = z.object({
  slug: z.string().trim().min(1).max(200),
  mode: z.enum(["strict", "standard", "learning"]).optional().default("standard"),
  language: z.string().trim().min(1).max(40).optional(),
});

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const postEventBodySchema = z.object({
  type: z.string().trim().min(1).max(80),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const ttsBodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  voice: z.string().trim().min(1).max(80).optional(),
  tone: z
    .enum([
      "neutral",
      "encouraging",
      "curious",
      "probing",
      "reassuring",
      "wrapping_up",
    ])
    .optional()
    .default("neutral"),
  rate: z.number().min(0.5).max(2).optional().default(1),
  pitch: z.number().min(0.5).max(2).optional().default(1),
  volume: z.number().min(0).max(1).optional().default(1),
});

export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;
export type PostEventBody = z.infer<typeof postEventBodySchema>;
export type TtsBody = z.infer<typeof ttsBodySchema>;
