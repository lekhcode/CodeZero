import type { ProblemCatalogItem } from "@/types/api.types";
import { scoreFlexibleProblemSearch } from "@/utils/problemSearchMatch";

export function scoreProblemSearchMatch(item: ProblemCatalogItem, term: string): number {
  return scoreFlexibleProblemSearch(item.title, item.slug, item.leetcodeId, term);
}

export function rankProblemSearchResults(
  items: ProblemCatalogItem[],
  term: string,
): ProblemCatalogItem[] {
  return [...items].sort((a, b) => {
    const diff = scoreProblemSearchMatch(b, term) - scoreProblemSearchMatch(a, term);
    if (diff !== 0) return diff;
    return a.leetcodeId - b.leetcodeId;
  });
}
