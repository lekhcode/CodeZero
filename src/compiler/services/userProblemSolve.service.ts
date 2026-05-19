import { SubmissionStatus } from "@prisma/client";
import { JudgeMode } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { markAssignmentsSolvedOnAccept } from "../../modules/assignments/assignmentTracking.service.js";
import { logAutoRevisionFromSolve } from "../../modules/autoRevisions/autoRevision.service.js";
import { logger } from "../../config/logger.js";

export async function recordSolveIfAccepted(input: {
  judgeSubmissionId: string;
  userId: string;
  problemId: string;
  mode: JudgeMode;
  status: SubmissionStatus;
}): Promise<void> {
  if (input.mode !== JudgeMode.FULL_JUDGE || input.status !== SubmissionStatus.ACCEPTED) {
    return;
  }

  await prisma.userProblemSolve.upsert({
    where: {
      userId_problemId: { userId: input.userId, problemId: input.problemId },
    },
    create: {
      userId: input.userId,
      problemId: input.problemId,
      solvedSubmissionId: input.judgeSubmissionId,
    },
    update: {},
  });

  await markAssignmentsSolvedOnAccept({
    userId: input.userId,
    problemId: input.problemId,
    judgeSubmissionId: input.judgeSubmissionId,
  });

  void logAutoRevisionFromSolve(input.userId, input.problemId).catch((err: unknown) => {
    logger.warn(
      { err, userId: input.userId, problemId: input.problemId },
      "smart auto-revision scheduling failed",
    );
  });
}
