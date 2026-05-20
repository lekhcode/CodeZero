import type { ForumPostType } from "@/types/forum.types";

export type CategoryBadgeVariant = "discussion" | "question" | "solution";

export function categoryBadgeVariant(type: ForumPostType): CategoryBadgeVariant {
  if (type === "QUESTION") return "question";
  if (type === "GUIDE" || type === "RESOURCE") return "solution";
  return "discussion";
}

export function authorDisplayName(author: {
  name: string | null;
  email: string;
}): string {
  return author.name?.trim() || author.email.split("@")[0] || "Member";
}

export function authorInitial(author: { name: string | null; email: string }): string {
  return authorDisplayName(author).charAt(0).toUpperCase();
}

export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Pull trailing hashtag-only lines from post body (composer appends tags). */
export function extractHashtags(content: string): { body: string; tags: string[] } {
  const lines = content.trimEnd().split("\n");
  const tags: string[] = [];

  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim();
    const matches = last.match(/#[\w-]+/g);
    if (matches && matches.length > 0 && last.replace(/#[\w-]+/g, "").trim() === "") {
      lines.pop();
      for (const m of matches) {
        tags.push(m.replace(/^#/, ""));
      }
    } else {
      break;
    }
  }

  return { body: lines.join("\n").trim(), tags };
}

export type ContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "code"; text: string };

export function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const parts = content.split(/```/);

  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      blocks.push({ kind: "code", text: part.trim() });
      return;
    }
    const paragraphs = part.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    for (const para of paragraphs) {
      blocks.push({ kind: "paragraph", text: para });
    }
  });

  if (blocks.length === 0 && content.trim()) {
    blocks.push({ kind: "paragraph", text: content.trim() });
  }

  return blocks;
}

/** Split paragraph into text + inline `code` spans. */
export function splitInlineCode(text: string): Array<{ type: "text" | "code"; value: string }> {
  const segments: Array<{ type: "text" | "code"; value: string }> = [];
  const re = /`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", value: text.slice(last, match.index) });
    }
    segments.push({ type: "code", value: match[1]! });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }

  if (segments.length === 0) {
    segments.push({ type: "text", value: text });
  }

  return segments;
}
