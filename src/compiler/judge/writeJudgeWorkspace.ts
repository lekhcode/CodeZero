import { copyFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGE_RUNTIMES } from "../constants/languages.js";
import type { CompilerLanguage } from "../types/index.js";
import { buildCppCodegenJudge } from "../languages/cpp/harness.js";
import { JS_JUDGE_HARNESS } from "../languages/javascript/harness.js";
import { PYTHON_JUDGE_HARNESS } from "../languages/python/harness.js";
import { JAVA_REFLECT_JUDGE } from "../languages/java/harness.js";
import { wrapUserSubmissionForJudge } from "../languages/wrapSubmission.js";
import type { ArgHintRow } from "./argCodegen.js";

export type JudgeCasePayload = { input: string; expected: string; hidden: boolean };

const JUDGE_RUNTIME_ROOT = dirname(fileURLToPath(import.meta.url));

async function writeRunScript(workspacePath: string, body: string): Promise<void> {
  await writeFile(join(workspacePath, "run.sh"), `#!/bin/sh\nset -e\ncd /workspace\n${body}`, {
    mode: 0o755,
  });
}

export async function materializeJudgeWorkspace(params: {
  workspacePath: string;
  language: CompilerLanguage;
  userCode: string;
  functionName: string;
  cases: JudgeCasePayload[];
  cppHints: ArgHintRow | null;
  timeoutSec: number;
}): Promise<{ dockerImage: string }> {
  const runtime = LANGUAGE_RUNTIMES[params.language];
  const wrappedUser = wrapUserSubmissionForJudge(params.language, params.userCode);

  const bundle = {
    functionName: params.functionName,
    cases: params.cases.map((c) => ({
      input: c.input,
      expected: c.expected,
      hidden: c.hidden,
    })),
  };

  await writeFile(join(params.workspacePath, "cases.json"), JSON.stringify(bundle), "utf8");
  await writeFile(join(params.workspacePath, "stdout.txt"), "", "utf8");
  await writeFile(join(params.workspacePath, "stderr.txt"), "", "utf8");
  await writeFile(join(params.workspacePath, "exitcode.txt"), "1", "utf8");

  const timeout = params.timeoutSec;

  if (params.language === "python") {
    await writeFile(join(params.workspacePath, "submission.py"), wrappedUser, "utf8");
    await writeFile(join(params.workspacePath, "harness.py"), PYTHON_JUDGE_HARNESS, "utf8");
    await writeRunScript(
      params.workspacePath,
      `timeout ${timeout}s python3 harness.py > stdout.txt 2> stderr.txt\necho $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  if (params.language === "javascript") {
    await writeFile(join(params.workspacePath, "submission.js"), wrappedUser, "utf8");
    await writeFile(join(params.workspacePath, "harness.js"), JS_JUDGE_HARNESS, "utf8");
    await writeRunScript(
      params.workspacePath,
      `timeout ${timeout}s node harness.js > stdout.txt 2> stderr.txt\necho $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  if (params.language === "cpp") {
    if (params.cppHints === null) {
      throw new Error("C++ judge requires judgeArgHints on the code template");
    }
    const mainCpp = buildCppCodegenJudge(params.functionName, params.cppHints, wrappedUser);
    await copyFile(
      join(JUDGE_RUNTIME_ROOT, "runtime", "json.hpp"),
      join(params.workspacePath, "json.hpp"),
    );
    await writeFile(join(params.workspacePath, "main.cpp"), mainCpp, "utf8");
    await writeRunScript(
      params.workspacePath,
      `g++ -O2 -std=c++17 -o judge main.cpp 2> stderr.txt || { echo 2 > exitcode.txt; exit 0; }\n` +
        `timeout ${timeout}s ./judge > stdout.txt 2>> stderr.txt || true\n` +
        `echo $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  if (params.language === "java") {
    await copyFile(
      join(JUDGE_RUNTIME_ROOT, "runtime", "json-org.jar"),
      join(params.workspacePath, "json-org.jar"),
    );
    await writeFile(join(params.workspacePath, "Solution.java"), wrappedUser, "utf8");
    await writeFile(join(params.workspacePath, "Judge.java"), JAVA_REFLECT_JUDGE, "utf8");
    await writeRunScript(
      params.workspacePath,
      `javac -encoding UTF-8 -cp json-org.jar *.java 2> stderr.txt || { echo 2 > exitcode.txt; exit 0; }\n` +
        `timeout ${timeout}s java -cp .:json-org.jar Judge > stdout.txt 2>> stderr.txt || true\n` +
        `echo $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  throw new Error("Unsupported judge language");
}
