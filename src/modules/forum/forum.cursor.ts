import { ApiError } from "../../utils/ApiError.js";

/** Cursor payload: ISO timestamp + UUID for stable keyset pagination. */
export type ForumCursor = {
  createdAt: Date;
  id: string;
};

export function encodeForumCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`, "utf8").toString("base64url");
}

export function decodeForumCursor(raw: string | undefined): ForumCursor | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const sep = decoded.lastIndexOf("|");
    if (sep <= 0) throw new Error("bad cursor");
    const createdAt = new Date(decoded.slice(0, sep));
    const id = decoded.slice(sep + 1);
    if (Number.isNaN(createdAt.getTime()) || id.length === 0) throw new Error("bad cursor");
    return { createdAt, id };
  } catch {
    throw ApiError.badRequest("Invalid pagination cursor");
  }
}

/** Comment feed sorts ascending — cursor uses same encoding. */
export function commentCursorWhere(cursor: ForumCursor | undefined): {
  OR?: Array<{ createdAt: { gt: Date } } | { createdAt: Date; id: { gt: string } }>;
} {
  if (cursor === undefined) return {};
  return {
    OR: [
      { createdAt: { gt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { gt: cursor.id } },
    ],
  };
}

export function postCursorWhere(cursor: ForumCursor | undefined): {
  OR?: Array<{ createdAt: { lt: Date } } | { createdAt: Date; id: { lt: string } }>;
} {
  if (cursor === undefined) return {};
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
}
