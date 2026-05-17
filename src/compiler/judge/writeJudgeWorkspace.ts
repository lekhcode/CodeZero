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
import { SHELL_NOW_MS, ZERO_COMPILE_MS } from "./timingRunScript.js";

export type JudgeCasePayload = { input: string; expected: string; hidden: boolean };

const JUDGE_RUNTIME_ROOT = dirname(fileURLToPath(import.meta.url));

async function writeRunScript(workspacePath: string, body: string): Promise<void> {
  await writeFile(
    join(workspacePath, "run.sh"),
    `#!/bin/sh\nset -e\ncd /workspace\n${SHELL_NOW_MS}\n${body}`,
    { mode: 0o755 },
  );
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

  const timeout = params.timeoutSec;
  const casesJson = JSON.stringify(bundle);

  const baseWrites: Promise<void>[] = [
    writeFile(join(params.workspacePath, "cases.json"), casesJson, "utf8"),
    writeFile(join(params.workspacePath, "stdout.txt"), "", "utf8"),
    writeFile(join(params.workspacePath, "stderr.txt"), "", "utf8"),
    writeFile(join(params.workspacePath, "exitcode.txt"), "1", "utf8"),
    writeFile(join(params.workspacePath, "compile_ms.txt"), "0", "utf8"),
  ];

  if (params.language === "python") {
    baseWrites.push(
      writeFile(join(params.workspacePath, "submission.py"), wrappedUser, "utf8"),
      writeFile(join(params.workspacePath, "harness.py"), PYTHON_JUDGE_HARNESS, "utf8"),
    );
    await Promise.all(baseWrites);
    await writeRunScript(
      params.workspacePath,
      `${ZERO_COMPILE_MS}\n` +
        `timeout ${timeout}s python3 harness.py > stdout.txt 2> stderr.txt || true\n` +
        `echo $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  if (params.language === "javascript") {
    baseWrites.push(
      writeFile(join(params.workspacePath, "submission.js"), wrappedUser, "utf8"),
      writeFile(join(params.workspacePath, "harness.js"), JS_JUDGE_HARNESS, "utf8"),
    );
    await Promise.all(baseWrites);
    await writeRunScript(
      params.workspacePath,
      `${ZERO_COMPILE_MS}\n` +
        `timeout ${timeout}s node harness.js > stdout.txt 2> stderr.txt || true\n` +
        `echo $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  if (params.language === "cpp") {
    if (params.cppHints === null) {
      throw new Error("C++ judge requires judgeArgHints on the code template");
    }
    const mainCpp = buildCppCodegenJudge(params.functionName, params.cppHints, wrappedUser);
    baseWrites.push(writeFile(join(params.workspacePath, "main.cpp"), mainCpp, "utf8"));
    await Promise.all(baseWrites);
    await copyFile(
      join(JUDGE_RUNTIME_ROOT, "runtime", "json.hpp"),
      join(params.workspacePath, "json.hpp"),
    );
    await writeRunScript(
      params.workspacePath,
      `COMPILE_START=$(_ms_now)\n` +
        `g++ -O2 -std=c++17 -o judge main.cpp 2> stderr.txt\n` +
        `COMPILE_RC=$?\n` +
        `COMPILE_END=$(_ms_now)\n` +
        `echo $((COMPILE_END - COMPILE_START)) > compile_ms.txt\n` +
        `if [ $COMPILE_RC -ne 0 ]; then echo 2 > exitcode.txt; exit 0; fi\n` +
        `timeout ${timeout}s ./judge > stdout.txt 2>> stderr.txt || true\n` +
        `echo $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  if (params.language === "java") {
    baseWrites.push(
      writeFile(join(params.workspacePath, "Solution.java"), wrappedUser, "utf8"),
      writeFile(join(params.workspacePath, "Judge.java"), JAVA_REFLECT_JUDGE, "utf8"),
    );
    await Promise.all(baseWrites);
    await copyFile(
      join(JUDGE_RUNTIME_ROOT, "runtime", "json-org.jar"),
      join(params.workspacePath, "json-org.jar"),
    );
    await writeRunScript(
      params.workspacePath,
      `COMPILE_START=$(_ms_now)\n` +
        `javac -encoding UTF-8 -cp json-org.jar *.java 2> stderr.txt\n` +
        `COMPILE_RC=$?\n` +
        `COMPILE_END=$(_ms_now)\n` +
        `echo $((COMPILE_END - COMPILE_START)) > compile_ms.txt\n` +
        `if [ $COMPILE_RC -ne 0 ]; then echo 2 > exitcode.txt; exit 0; fi\n` +
        `timeout ${timeout}s java -cp .:json-org.jar Judge > stdout.txt 2>> stderr.txt || true\n` +
        `echo $? > exitcode.txt\n`,
    );
    return { dockerImage: runtime.dockerImage };
  }

  throw new Error("Unsupported judge language");
}
