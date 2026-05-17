import type { CompilerLanguage } from "../types/index.js";

const HINT_FALLBACK_NAMES: Record<string, string[]> = {
  "int[],int": ["nums", "target"],
  "int[],int,int": ["nums", "target", "k"],
  "String,int": ["s", "k"],
};

/** Parse parameter names from starter code for judge UI labels. */
export function parseMethodParamNames(
  starterCode: string,
  functionName: string,
  language: CompilerLanguage,
  judgeArgHints: string | null,
): string[] {
  const fromSignature = parseFromSignature(starterCode, functionName, language);
  if (fromSignature.length > 0) return fromSignature;

  if (judgeArgHints !== null && judgeArgHints.trim() !== "") {
    try {
      const hints = JSON.parse(judgeArgHints) as unknown;
      if (Array.isArray(hints) && hints.every((h) => typeof h === "string")) {
        const key = hints.join(",");
        const fallback = HINT_FALLBACK_NAMES[key];
        if (fallback !== undefined && fallback.length === hints.length) {
          return [...fallback];
        }
        return hints.map((h, i) => genericNameForHint(String(h), i));
      }
    } catch {
      /* ignore */
    }
  }

  return [];
}

function genericNameForHint(hint: string, index: number): string {
  if (hint === "int[]") return index === 0 ? "nums" : `arg${index}`;
  if (hint === "int" && index === 1) return "target";
  if (hint === "String") return index === 0 ? "s" : `arg${index}`;
  return `arg${index}`;
}

function parseFromSignature(
  code: string,
  functionName: string,
  language: CompilerLanguage,
): string[] {
  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (language === "java") {
    const re = new RegExp(`\\b${escaped}\\s*\\(([^)]*)\\)`);
    const m = re.exec(code);
    if (m?.[1] === undefined) return [];
    return splitJavaParams(m[1]);
  }

  if (language === "python") {
    const re = new RegExp(`def\\s+${escaped}\\s*\\(([^)]*)\\)`);
    const m = re.exec(code);
    if (m?.[1] === undefined) return [];
    return m[1]
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && p !== "self")
      .map((p) => p.split(":")[0]!.trim().split("=")[0]!.trim());
  }

  if (language === "javascript") {
    const re = new RegExp(`\\b${escaped}\\s*\\(([^)]*)\\)`);
    const m = re.exec(code);
    if (m?.[1] === undefined) return [];
    return m[1]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => p.split(":")[0]!.trim());
  }

  if (language === "cpp") {
    const re = new RegExp(`\\b${escaped}\\s*\\(([^)]*)\\)`);
    const m = re.exec(code);
    if (m?.[1] === undefined) return [];
    return splitCppParams(m[1]);
  }

  return [];
}

function splitJavaParams(inner: string): string[] {
  const names: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of inner) {
    if (ch === "<") depth++;
    else if (ch === ">") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      const n = lastJavaToken(buf);
      if (n) names.push(n);
      buf = "";
      continue;
    }
    buf += ch;
  }
  const last = lastJavaToken(buf);
  if (last) names.push(last);
  return names;
}

function lastJavaToken(part: string): string {
  const t = part.trim().replace(/\[\]|\[\s*\]/g, "").split(/\s+/);
  const name = t[t.length - 1]?.replace(/[^a-zA-Z0-9_]/g, "") ?? "";
  return name.length > 0 ? name : "";
}

function splitCppParams(inner: string): string[] {
  return inner
    .split(",")
    .map((p) => {
      const t = p.trim().split(/\s+/);
      const raw = t[t.length - 1] ?? "";
      return raw.replace(/[&*[\]]/g, "");
    })
    .filter((n) => n.length > 0);
}
