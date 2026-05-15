const DEFAULT_MAX = 64_000;

/** Cap stored stdout/stderr so a single job cannot blow Postgres rows. */
export function truncateOutput(text: string, maxBytes = DEFAULT_MAX): string {
  const buf = Buffer.from(text, "utf8");
  if (buf.length <= maxBytes) return text;
  const slice = buf.subarray(0, maxBytes);
  return `${slice.toString("utf8")}\n...[truncated]`;
}
