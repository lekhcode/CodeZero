export type CompilerLanguage = "javascript" | "python" | "cpp" | "java";

export type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export type CompilerSubmission = {
  id: string;
  language: string;
  status: SubmissionStatus;
  stdout: string | null;
  stderr: string | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  exitCode: number | null;
  createdAt: string;
  updatedAt: string;
};

export const COMPILER_LANGUAGES: Array<{ id: CompilerLanguage; label: string }> = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
];

export const STARTER_CODE: Record<CompilerLanguage, string> = {
  javascript: `// stdin is piped from the playground\nconst fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\nconsole.log("Result:", input || "hello");\n`,
  python: `import sys\ndata = sys.stdin.read().strip()\nprint("Result:", data or "hello")\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  // your solution\n  return 0;\n}\n`,
  java: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    // your solution\n  }\n}\n`,
};
