const PROFANITY = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "damn",
  "cunt",
  "dick",
  "piss",
  "slut",
  "whore",
];

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY.some((word) => {
    const re = new RegExp(`\\b${word}\\b`, "i");
    return re.test(lower);
  });
}

export function sanitizeForumText(text: string): string {
  return text.replace(/\0/g, "").trim();
}

export function assertForumContentAllowed(title: string, content: string): void {
  const combined = `${title}\n${content}`;
  if (containsProfanity(combined)) {
    throw new Error("PROFANITY");
  }
  if (/(<script|javascript:|onerror=)/i.test(combined)) {
    throw new Error("UNSAFE_CONTENT");
  }
}

export function extractLinkHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function countUrls(text: string): number {
  const matches = text.match(URL_PATTERN);
  return matches?.length ?? 0;
}
