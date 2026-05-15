import { api, unwrap } from "./api";
import type { CompilerLanguage } from "@/types/compiler.types";
import type { JudgeMeta, JudgeSubmission } from "@/types/judge.types";

type CodePayload = {
  language: CompilerLanguage;
  code: string;
};

type SubmitPayload = CodePayload & {
  codingDurationMs?: number;
};

export const judgeService = {
  getJudgeMeta(slug: string) {
    return unwrap<JudgeMeta>(api.get(`/api/v1/problems/${slug}/judge-meta`));
  },

  run(slug: string, payload: CodePayload) {
    return unwrap<{ judgeSubmissionId: string }>(api.post(`/api/v1/problems/${slug}/run`, payload));
  },

  submit(slug: string, payload: SubmitPayload) {
    return unwrap<{ judgeSubmissionId: string }>(
      api.post(`/api/v1/problems/${slug}/submit`, payload),
    );
  },

  getSubmission(id: string) {
    return unwrap<{ submission: JudgeSubmission }>(api.get(`/api/v1/judge/submissions/${id}`));
  },
};
