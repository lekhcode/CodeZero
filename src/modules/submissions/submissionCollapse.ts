/**
 * Collapse consecutive same-problem submissions (newest-first timeline).
 * Within each uninterrupted run, only the latest attempt is kept.
 */
export function collapseConsecutiveByProblem<T extends { problemId: string }>(
  rowsNewestFirst: T[],
): Array<{ representative: T; collapsedAttempts: number }> {
  const out: Array<{ representative: T; collapsedAttempts: number }> = [];
  let i = 0;

  while (i < rowsNewestFirst.length) {
    const head = rowsNewestFirst[i];
    if (head === undefined) break;
    const problemId = head.problemId;
    let j = i;
    while (j + 1 < rowsNewestFirst.length) {
      const next = rowsNewestFirst[j + 1];
      if (next === undefined || next.problemId !== problemId) break;
      j++;
    }
    out.push({
      representative: head,
      collapsedAttempts: j - i + 1,
    });
    i = j + 1;
  }

  return out;
}
