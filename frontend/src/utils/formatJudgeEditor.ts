import type { editor } from "monaco-editor";
import type { CompilerLanguage } from "@/types/compiler.types";

export type FormatJudgeResult =
  | { ok: true }
  | { ok: false; reason: string };

function applyFullReplace(ed: editor.IStandaloneCodeEditor, next: string): void {
  const model = ed.getModel();
  if (!model) return;
  const normalized = next.endsWith("\n") ? next : `${next}\n`;
  ed.pushUndoStop();
  ed.executeEdits("judge-format", [{ range: model.getFullModelRange(), text: normalized }]);
  ed.pushUndoStop();
}

function tidyWhitespace(code: string, language: "python" | "cpp"): string {
  const tabWidth = language === "python" ? 4 : 4;
  const lines = code.split("\n").map((line) => {
    let t = line.replace(/\t/g, " ".repeat(tabWidth));
    t = t.replace(/[\t ]+$/u, "");
    return t;
  });
  let out = lines.join("\n").replace(/\n{4,}/g, "\n\n\n");
  if (!out.endsWith("\n")) out += "\n";
  return out;
}

/**
 * JavaScript / Java: Prettier (browser) — avoids Monaco’s half-baked “format” for those modes.
 * Python / C++: Monaco format when available, else whitespace tidy.
 */
export async function formatJudgeEditor(
  ed: editor.IStandaloneCodeEditor,
  language: CompilerLanguage,
): Promise<FormatJudgeResult> {
  const model = ed.getModel();
  if (!model) return { ok: false, reason: "Editor is not ready." };

  const before = model.getValue();

  try {
    if (language === "javascript") {
      const prettier = await import("prettier/standalone");
      const estree = await import("prettier/plugins/estree");
      const babel = await import("prettier/plugins/babel");
      const formatted = await prettier.format(before, {
        parser: "babel",
        plugins: [estree, babel],
        printWidth: 100,
        tabWidth: 2,
        trailingComma: "all",
      });
      applyFullReplace(ed, formatted);
      return { ok: true };
    }

    if (language === "java") {
      const prettier = await import("prettier/standalone");
      const javaPlugin = (await import("prettier-plugin-java")).default;
      const formatted = await prettier.format(before, {
        parser: "java",
        plugins: [javaPlugin],
        printWidth: 100,
        tabWidth: 4,
      });
      applyFullReplace(ed, formatted);
      return { ok: true };
    }

    if (language === "python" || language === "cpp") {
      const action = ed.getAction("editor.action.formatDocument");
      if (action !== null) {
        await action.run();
        if (model.getValue() !== before) {
          return { ok: true };
        }
      }

      const tidied = tidyWhitespace(before, language);
      if (tidied !== before) {
        applyFullReplace(ed, tidied);
        return { ok: true };
      }
      return {
        ok: false,
        reason:
          language === "python"
            ? "Nothing more to tidy. Full Python layout needs a local formatter (e.g. Black)."
            : "Nothing more to tidy. Full C++ layout needs clang-format locally.",
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: msg.length > 160 ? `${msg.slice(0, 158)}…` : msg };
  }

  return { ok: false, reason: "Nothing changed." };
}
