import { api, unwrap } from "./api";
import type { CompilerSubmission } from "@/types/compiler.types";

/** Legacy playground submissions only (online judge uses `judgeService`). */
export const compilerService = {
  async getSubmission(id: string): Promise<CompilerSubmission> {
    const payload = await unwrap<{ submission: CompilerSubmission }>(
      api.get(`/api/v1/compiler/submissions/${id}`),
    );
    return payload.submission;
  },
};
