import type { CompilerLanguage } from "../types/index.js";

export type LanguageRuntimeConfig = {
  id: CompilerLanguage;
  /** Official Docker image — execution never happens on the API host process. */
  dockerImage: string;
  /** Filename written into the sandbox workspace. */
  sourceFile: string;
  /** Shell script run inside the container (workspace = /workspace). */
  runScript: string;
  needsCompile: boolean;
};

/**
 * Per-language compile/run scripts execute inside isolated containers.
 * `timeout` uses coreutils from Alpine/Debian images.
 */
export const LANGUAGE_RUNTIMES: Record<CompilerLanguage, LanguageRuntimeConfig> = {
  javascript: {
    id: "javascript",
    dockerImage: "node:20-alpine",
    sourceFile: "main.js",
    needsCompile: false,
    runScript: [
      "cd /workspace",
      "timeout ${TIMEOUT_SEC} node main.js < input.txt > stdout.txt 2> stderr.txt",
      "echo $? > exitcode.txt",
    ].join("\n"),
  },
  python: {
    id: "python",
    dockerImage: "python:3.12-alpine",
    sourceFile: "main.py",
    needsCompile: false,
    runScript: [
      "cd /workspace",
      "timeout ${TIMEOUT_SEC} python3 main.py < input.txt > stdout.txt 2> stderr.txt",
      "echo $? > exitcode.txt",
    ].join("\n"),
  },
  cpp: {
    id: "cpp",
    dockerImage: "gcc:14-bookworm",
    sourceFile: "main.cpp",
    needsCompile: true,
    runScript: [
      "cd /workspace",
      "g++ -O2 -std=c++17 -o main main.cpp 2> stderr.txt",
      "if [ $? -ne 0 ]; then echo 2 > exitcode.txt; exit 0; fi",
      "timeout ${TIMEOUT_SEC} ./main < input.txt > stdout.txt 2>> stderr.txt",
      "echo $? > exitcode.txt",
    ].join("\n"),
  },
  java: {
    id: "java",
    dockerImage: "eclipse-temurin:17-jdk-alpine",
    sourceFile: "Main.java",
    needsCompile: true,
    runScript: [
      "cd /workspace",
      "javac Main.java 2> stderr.txt",
      "if [ $? -ne 0 ]; then echo 2 > exitcode.txt; exit 0; fi",
      "timeout ${TIMEOUT_SEC} java Main < input.txt > stdout.txt 2>> stderr.txt",
      "echo $? > exitcode.txt",
    ].join("\n"),
  },
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_RUNTIMES) as CompilerLanguage[];
