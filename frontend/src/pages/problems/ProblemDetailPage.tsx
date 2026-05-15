import { useMemo } from "react";
import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { ProblemJudgeWorkspace } from "@/modules/judge/ProblemJudgeWorkspace";
import { problemsService } from "@/services/problems.service";
import { judgeService } from "@/services/judge.service";
import { queryKeys } from "@/hooks/queryKeys";
import { useAuthStore } from "@/store/authStore";
import type { JudgeRecentSubmission } from "@/types/judge.types";

/** Title row: problem name → difficulty → Solved badge (after difficulty). */
function ProblemTitleRow(props: {
  title: string;
  difficulty: string;
  isPremium: boolean;
  isAuthenticated: boolean;
  judgeSolved: boolean;
  recentSubmissions: JudgeRecentSubmission[];
}) {
  const { title, difficulty, isPremium, isAuthenticated, judgeSolved, recentSubmissions } = props;

  const hasAcceptedSubmit = useMemo(
    () => recentSubmissions.some((s) => s.status === "ACCEPTED"),
    [recentSubmissions],
  );

  const showSolvedBadge = Boolean(isAuthenticated && (judgeSolved || hasAcceptedSubmit));

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        flexWrap: "wrap",
        alignItems: "center",
        mb: 0.75,
        flexShrink: 0,
      }}
    >
      <Typography variant="h6" component="h1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
        {title}
      </Typography>
      <DifficultyChip difficulty={difficulty} />
      {showSolvedBadge ? (
        <Chip
          icon={<CheckCircleRoundedIcon />}
          label="Solved"
          size="small"
          sx={{
            flexShrink: 0,
            height: 28,
            pl: 0.25,
            fontWeight: 800,
            color: "#e8fff4",
            bgcolor: "#1a7f37",
            border: "1px solid #56d364",
            boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
            "& .MuiChip-icon": { color: "#b4f8c8 !important" },
            "& .MuiChip-label": { px: 0.75 },
          }}
        />
      ) : null}
      {isPremium ? <Chip label="Premium" color="warning" size="small" sx={{ flexShrink: 0 }} /> : null}
    </Stack>
  );
}

export function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const detailQuery = useQuery({
    queryKey: queryKeys.problem(slug ?? ""),
    queryFn: () => problemsService.getBySlug(slug!),
    enabled: Boolean(slug),
  });

  const judgeQuery = useQuery({
    queryKey: [...queryKeys.judgeMeta(slug ?? ""), isAuthenticated] as const,
    queryFn: () => judgeService.getJudgeMeta(slug!),
    enabled: Boolean(slug),
    staleTime: 0,
  });

  if (!slug) {
    return (
      <PageContainer>
        <Alert severity="error">Invalid problem URL</Alert>
      </PageContainer>
    );
  }

  const loading = detailQuery.isLoading || judgeQuery.isLoading;
  const errMsg =
    detailQuery.isError === true ? (detailQuery.error as Error).message : null;
  const judgeErr =
    judgeQuery.isError === true ? (judgeQuery.error as Error).message : null;

  return (
    <PageContainer
      sx={{
        maxWidth: "none",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: { xs: "calc(100dvh - 56px)", md: "calc(100dvh - 64px)" },
        overflow: "hidden",
        mx: { xs: 0.5, sm: 1 },
        px: { xs: 1, sm: 1.5 },
        py: { xs: 1, sm: 1.25 },
      }}
    >
      {loading && <LoadingSkeleton variant="detail" />}
      {errMsg && <Alert severity="error">{errMsg}</Alert>}
      {judgeErr && !detailQuery.isError && <Alert severity="warning">{judgeErr}</Alert>}

      {detailQuery.data && judgeQuery.data && (
        <Box
          sx={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ProblemTitleRow
            title={detailQuery.data.title}
            difficulty={detailQuery.data.difficulty}
            isPremium={detailQuery.data.isPremium}
            isAuthenticated={isAuthenticated}
            judgeSolved={judgeQuery.data.solved}
            recentSubmissions={judgeQuery.data.recentSubmissions}
          />

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 0.75, flexShrink: 0 }}>
            {detailQuery.data.topics.map((t) => (
              <Chip key={t} label={t} size="small" variant="outlined" />
            ))}
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ProblemJudgeWorkspace slug={slug} problem={detailQuery.data} judgeMeta={judgeQuery.data} />
          </Box>
        </Box>
      )}
    </PageContainer>
  );
}
