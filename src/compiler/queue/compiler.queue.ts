import { Queue } from "bullmq";
import { env } from "../../config/env.js";
import { JUDGE_JOB_NAME, PLAYGROUND_JOB_NAME } from "../constants/queue.js";
import type { CompilerJobPayload } from "../types/index.js";
import { getRedisConnection } from "./connection.js";

let compilerQueue: Queue<CompilerJobPayload> | null = null;

export function getCompilerQueue(): Queue<CompilerJobPayload> {
  if (compilerQueue === null) {
    compilerQueue = new Queue<CompilerJobPayload>(env.COMPILER_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: env.COMPILER_JOB_ATTEMPTS,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail: { count: 5_000 },
      },
    });
  }
  return compilerQueue;
}

export async function enqueuePlaygroundSubmissionJob(submissionId: string): Promise<string> {
  const job = await getCompilerQueue().add(
    PLAYGROUND_JOB_NAME,
    { kind: "playground", submissionId },
    { jobId: `pg-${submissionId}` },
  );
  return job.id ?? submissionId;
}

export async function enqueueJudgeSubmissionJob(judgeSubmissionId: string): Promise<string> {
  const job = await getCompilerQueue().add(
    JUDGE_JOB_NAME,
    { kind: "judge", judgeSubmissionId },
    { jobId: `jg-${judgeSubmissionId}` },
  );
  return job.id ?? judgeSubmissionId;
}

export async function closeCompilerQueue(): Promise<void> {
  if (compilerQueue !== null) {
    await compilerQueue.close();
    compilerQueue = null;
  }
}
