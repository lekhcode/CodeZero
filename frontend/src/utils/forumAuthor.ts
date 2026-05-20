/** Stable per-user accent for avatars / rails (feels like distinct members). */
const AVATAR_PALETTE = [
  "#8b9dc3",
  "#a8c686",
  "#d4a574",
  "#c9a0dc",
  "#7eb8b3",
  "#e8a0a0",
  "#9ec5ff",
  "#b5a642",
  "#86a7c8",
  "#c78f9b",
  "#7dcea0",
  "#bb8fce",
] as const;

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function authorAccentColor(authorId: string): string {
  return AVATAR_PALETTE[hashString(authorId) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
}

export function authorHandle(username: string | null | undefined): string | null {
  if (!username) return null;
  return `@${username}`;
}

export function authorDisplayName(name: string | null, email: string): string {
  if (name !== null && name.trim().length > 0) return name.trim();
  const local = email.split("@")[0];
  return local ?? "Member";
}

export function authorInitials(name: string | null, email: string): string {
  const display = authorDisplayName(name, email);
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return display.slice(0, 2).toUpperCase();
}
