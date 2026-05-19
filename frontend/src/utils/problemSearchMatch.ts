/**
 * Client-side flexible problem search helpers (keep in sync with backend problemSearch.utils.ts).
 */

const NUMBER_WORD_TO_DIGIT: Readonly<Record<string, string>> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
};

const DIGIT_TO_NUMBER_WORD = new Map<string, string[]>(
  Object.entries(NUMBER_WORD_TO_DIGIT).reduce((acc, [word, digit]) => {
    const list = acc.get(digit) ?? [];
    list.push(word);
    acc.set(digit, list);
    return acc;
  }, new Map<string, string[]>()),
);

export function normalizeAlphanumeric(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function tokenizeSearchQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

export function expandTokenVariants(token: string): string[] {
  const out = new Set<string>([token]);
  const asDigit = NUMBER_WORD_TO_DIGIT[token];
  if (asDigit !== undefined) out.add(asDigit);
  if (/^\d+$/.test(token)) {
    for (const word of DIGIT_TO_NUMBER_WORD.get(token) ?? []) {
      out.add(word);
    }
  }
  return [...out];
}

export function expandQueryCompactVariants(query: string): string[] {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return [];

  const variantLists = tokens.map((t) =>
    expandTokenVariants(t).map((v) => normalizeAlphanumeric(v)).filter((v) => v.length > 0),
  );

  const combos: string[][] = [[]];
  for (const variants of variantLists) {
    const next: string[][] = [];
    for (const prefix of combos) {
      for (const v of variants) {
        next.push([...prefix, v]);
      }
    }
    combos.length = 0;
    combos.push(...next);
  }

  const compacts = new Set<string>();
  for (const parts of combos) {
    compacts.add(parts.join(""));
  }
  compacts.add(normalizeAlphanumeric(query));
  return [...compacts].filter((c) => c.length > 0);
}

export function scoreFlexibleProblemSearch(
  title: string,
  slug: string,
  leetcodeId: number,
  query: string,
): number {
  const q = query.trim();
  if (q.length === 0) return 0;

  const titleLower = title.toLowerCase();
  const slugLower = slug.toLowerCase();
  const qLower = q.toLowerCase();
  const titleCompact = normalizeAlphanumeric(title);
  const slugCompact = normalizeAlphanumeric(slug);
  const idStr = String(leetcodeId);

  let best = 0;
  const bump = (score: number) => {
    if (score > best) best = score;
  };

  if (titleLower === qLower) bump(1000);
  if (slugLower === qLower) bump(950);
  if (titleLower.startsWith(qLower)) bump(800);
  if (slugLower.startsWith(qLower)) bump(750);
  if (idStr === qLower) bump(700);

  for (const compact of expandQueryCompactVariants(q)) {
    if (compact.length === 0) continue;
    if (titleCompact === compact) bump(980);
    if (slugCompact === compact) bump(930);
    if (titleCompact.startsWith(compact)) bump(780);
    if (slugCompact.startsWith(compact)) bump(730);
    if (titleCompact.includes(compact)) bump(620);
    if (slugCompact.includes(compact)) bump(560);
  }

  if (titleLower.includes(qLower)) bump(600);
  if (slugLower.includes(qLower)) bump(500);
  if (idStr.includes(qLower)) bump(400);

  const tokens = tokenizeSearchQuery(q);
  if (tokens.length > 1) {
    const allTitle = tokens.every((t) =>
      expandTokenVariants(t).some((v) => titleCompact.includes(normalizeAlphanumeric(v))),
    );
    if (allTitle) bump(650);
  }

  return best;
}
