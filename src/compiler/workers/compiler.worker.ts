import { Worker, type Job } from "bullmq";
import { env } from "../../config/env.js";
import { getRedisConnection, closeRedisConnection } from "../queue/connection.js";
import { closeCompilerQueue } from "../queue/compiler.queue.js";
import { processSubmissionJob, handleDeadLetter } from "../services/execution.service.js";
import { recoverStaleRunningSubmissions } from "../services/submission.service.js";
import {
  handleJudgeDeadLetter,
  processJudgeWorkerJob,
  recoverStaleJudgeSubmissions,
} from "../services/judgeSubmission.service.js";
import { JUDGE_JOB_NAME, PLAYGROUND_JOB_NAME } from "../constants/queue.js";
import { compilerLogger } from "../utils/logger.js";

type JobData = {
  kind?: "playground" | "judge";
  submissionId?: string;
  judgeSubmissionId?: string;
};

let workerInstance: Worker<JobData> | null = null;

async function onJob(job: Job<JobData>): Promise<void> {
  if (job.name === JUDGE_JOB_NAME) {
    const id = job.data.judgeSubmissionId;
    if (id === undefined || id === "") {
      compilerLogger.warn({ jobId: job.id }, "judge job missing judgeSubmissionId");
      return;
    }
    compilerLogger.info(
      { jobId: job.id, judgeSubmissionId: id, attempt: job.attemptsMade + 1 },
      "processing judge job",
    );
    await processJudgeWorkerJob(id, { workerPickedAt: Date.now() });
    return;
  }

  if (job.name === PLAYGROUND_JOB_NAME) {
    const sid = job.data.submissionId;
    if (sid === undefined || sid === "") {
      compilerLogger.warn({ jobId: job.id }, "playground job missing submissionId");
      return;
    }
    compilerLogger.info(
      { jobId: job.id, submissionId: sid, attempt: job.attemptsMade + 1 },
      "processing playground job",
    );
    await processSubmissionJob(sid);
    return;
  }

  compilerLogger.warn({ jobId: job.id, name: job.name }, "unknown job name skipped");
}

export async function startCompilerWorker(): Promise<Worker<JobData>> {
  await recoverStaleRunningSubmissions();
  await recoverStaleJudgeSubmissions();

  workerInstance = new Worker<JobData>(env.COMPILER_QUEUE_NAME, onJob, {
    connection: getRedisConnection(),
    concurrency: 4,
    lockDuration: env.COMPILER_JOB_TIMEOUT_MS + 10_000,
  });

  workerInstance.on("completed", (job) => {
    compilerLogger.info({ jobId: job.id, name: job.name }, "job completed");
  });

  workerInstance.on("failed", (job, err) => {
    if (job === undefined) return;
    compilerLogger.error(
      { err, jobId: job.id, name: job.name, attempts: job.attemptsMade },
      "job failed",
    );
    const max = job.opts.attempts ?? env.COMPILER_JOB_ATTEMPTS;
    if (job.attemptsMade < max) return;
    if (job.name === JUDGE_JOB_NAME && job.data.judgeSubmissionId !== undefined) {
      void handleJudgeDeadLetter(job.data.judgeSubmissionId, err.message);
    } else if (job.name === PLAYGROUND_JOB_NAME && job.data.submissionId !== undefined) {
      void handleDeadLetter(job.data.submissionId, err.message);
    }
  });

  workerInstance.on("error", (err) => {
    compilerLogger.error({ err }, "worker error");
  });

  compilerLogger.info({ queue: env.COMPILER_QUEUE_NAME }, "compiler worker started");
  return workerInstance;
}

export async function stopCompilerWorker(): Promise<void> {
  if (workerInstance !== null) {
    await workerInstance.close();
    workerInstance = null;
  }
  await closeCompilerQueue();
  await closeRedisConnection();
  compilerLogger.info("compiler worker stopped");
}
