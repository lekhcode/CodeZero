import { useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { FixedPageShell } from "@/components/layout/FixedPageShell";
import { SubmissionOverviewSection } from "@/components/submissions/SubmissionOverviewSection";
import {
  SubmissionRunsPanel,
  type SubmissionLanguageFilter,
} from "@/components/submissions/SubmissionRunsPanel";
import { ROLLING_VALUE, type ActivityYearSelection } from "@/components/submissions/SubmissionActivityHeatmap";
import { submissionsService } from "@/services/submissions.service";
import { problemsService } from "@/services/problems.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { SubmissionStatus } from "@/types/api.types";

/** ~10 table rows at 52px + header + panel chrome */
const RECENT_SUBMITTED_MIN_H = 560;

export function SubmissionsPage() {
  const [activitySelection, setActivitySelection] = useState<ActivityYearSelection>(ROLLING_VALUE);
  const [page, setPage] = useState(1);
  const [verdict, setVerdict] = useState<SubmissionStatus | "ALL">("ALL");
  const [language, setLanguage] = useState<SubmissionLanguageFilter>("ALL");

  const activityKey =
    activitySelection === ROLLING_VALUE ? "rolling" : activitySelection;

  const filters = useMemo(
    () => ({
      page,
      limit: 25,
      ...(verdict !== "ALL" ? { verdict } : {}),
      ...(language !== "ALL" ? { language } : {}),
    }),
    [page, verdict, language],
  );

  const activityQuery = useQuery({
    queryKey: queryKeys.submissionActivity(activityKey),
    queryFn: () =>
      submissionsService.getActivity(
        activitySelection === ROLLING_VALUE
          ? { rolling: true }
          : { year: activitySelection as number },
      ),
  });

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions(filters),
    queryFn: () => submissionsService.list(filters),
  });

  const solvedStatsQuery = useQuery({
    queryKey: queryKeys.submissionsSolvedStats,
    queryFn: submissionsService.getSolvedStats,
    staleTime: 30_000,
  });

  const catalogStatsQuery = useQuery({
    queryKey: queryKeys.problemCatalogStats(false),
    queryFn: () => problemsService.getCatalogStats(false),
    staleTime: 60_000,
  });

  const submissions = submissionsQuery.data?.submissions ?? [];
  const totalPages = submissionsQuery.data?.totalPages ?? 1;

  return (
    <FixedPageShell
      sx={{
        display: "grid",
        gridTemplateRows: `auto auto minmax(${RECENT_SUBMITTED_MIN_H}px, 1fr)`,
        gap: 1.25,
        minHeight: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
        <Button
          component={RouterLink}
          to="/community"
          size="small"
          sx={{ minWidth: 0, px: 1, color: "text.secondary", flexShrink: 0 }}
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Submissions
        </Typography>
      </Box>

      <SubmissionOverviewSection
        solved={solvedStatsQuery.data}
        catalog={catalogStatsQuery.data}
        solvedLoading={solvedStatsQuery.isLoading || catalogStatsQuery.isLoading}
        activity={activityQuery.data}
        activityLoading={activityQuery.isLoading}
        activityError={activityQuery.isError}
        activitySelection={activitySelection}
        onActivitySelectionChange={setActivitySelection}
      />

      <SubmissionRunsPanel
        verdict={verdict}
        language={language}
        onVerdictChange={(v) => {
          setVerdict(v);
          setPage(1);
        }}
        onLanguageChange={(l) => {
          setLanguage(l);
          setPage(1);
        }}
        submissions={submissions}
        total={submissionsQuery.data?.total}
        totalPages={totalPages}
        page={page}
        onPageChange={setPage}
        loading={submissionsQuery.isLoading}
        error={submissionsQuery.error}
      />
    </FixedPageShell>
  );
}
