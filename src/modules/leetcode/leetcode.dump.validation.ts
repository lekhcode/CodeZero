import { z } from "zod";

export const dumpCatalogBodySchema = z.object({
  nonPremiumOnly: z.boolean().optional().default(true),
  pageSize: z.number().int().min(1).max(100).optional().default(50),
});

export const dumpDetailsBodySchema = z.object({
  nonPremiumOnly: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(500).optional(),
  delayMs: z.number().int().min(0).max(10_000).optional(),
  force: z.boolean().optional().default(false),
});

export const dumpNeetCode150BodySchema = z.object({
  delayMs: z.number().int().min(0).max(10_000).optional(),
  /** When true (default), writes `prisma/data/neetcode-150.json` for CLI sync. */
  persistToRepo: z.boolean().optional().default(true),
});

export type DumpCatalogBody = z.infer<typeof dumpCatalogBodySchema>;
export type DumpDetailsBody = z.infer<typeof dumpDetailsBodySchema>;
export type DumpNeetCode150Body = z.infer<typeof dumpNeetCode150BodySchema>;
