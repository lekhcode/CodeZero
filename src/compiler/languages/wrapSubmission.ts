import type { CompilerLanguage } from "../types/index.js";
import { JAVASCRIPT_MODULE_EPILOGUE, JAVASCRIPT_PRELUDE } from "./javascript/config.js";
import { JAVA_PRELUDE } from "./java/config.js";
import { PYTHON_PRELUDE } from "./python/config.js";

/**
 * Turns editor payload into sandbox source:
 * prelude/exports for interpreted langs; C++ prelude lives in generated {@code main.cpp}.
 */
export function wrapUserSubmissionForJudge(language: CompilerLanguage, userCode: string): string {
  const trimmed = userCode.trim();
  switch (language) {
    case "java":
      return `${JAVA_PRELUDE}\n\n${trimmed}\n`;
    case "python":
      return `${PYTHON_PRELUDE}\n\n${trimmed}\n`;
    case "javascript":
      return `${JAVASCRIPT_PRELUDE}${trimmed}${JAVASCRIPT_MODULE_EPILOGUE}`;
    case "cpp":
      return trimmed;
    default: {
      const exhaustive: never = language;
      throw new Error(`Unsupported language ${String(exhaustive)}`);
    }
  }
}
