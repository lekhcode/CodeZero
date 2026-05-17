import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Pagination,
  Typography,
  alpha,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { FixedPageShell } from "@/components/layout/FixedPageShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { SubmissionHistoryRow } from "@/components/learning/SubmissionHistoryRow";
import {
  ROLLING_VALUE,
  SubmissionActivityHeatmap,
  type ActivityYearSelection,
} from "@/components/submissions/SubmissionActivityHeatmap";
import { submissionsService } from "@/services/submissions.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { SubmissionStatus } from "@/types/api.types";
import { miui, sectionCardSx, sectionContentSx, sectionInsetX } from "@/theme/theme";

const VERDICT_FILTERS: Array<{ value: SubmissionStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "WRONG_ANSWER", label: "WA" },
  { value: "RUNTIME_ERROR", label: "RE" },
  { value: "COMPILATION_ERROR", label: "CE" },
  { value: "TIME_LIMIT_EXCEEDED", label: "TLE" },
];

const LANGUAGE_FILTERS = ["ALL", "javascript", "python", "java", "cpp"] as const;

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.62rem",
          mb: 0.5,
          display: "block",
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>{children}</Box>
    </Box>
  );
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      fullWidth
      size="small"
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        fontWeight: active ? 700 : 500,
        fontSize: "0.8rem",
        py: 0.45,
        px: 1,
        minHeight: 32,
        borderRadius: 1.5,
        color: active ? "primary.main" : "text.secondary",
        bgcolor: active ? alpha(miui.primary, 0.1) : "transparent",
      }}
    >
      {label}
    </Button>
  );
}

export function SubmissionsPage() {
  const [activitySelection, setActivitySelection] = useState<ActivityYearSelection>(ROLLING_VALUE);
  const [page, setPage] = useState(1);
  const [verdict, setVerdict] = useState<SubmissionStatus | "ALL">("ALL");
  const [language, setLanguage] = useState<(typeof LANGUAGE_FILTERS)[number]>("ALL");

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

  const submissions = submissionsQuery.data?.submissions ?? [];
  const totalPages = submissionsQuery.data?.totalPages ?? 1;

  return (
    <FixedPageShell>
      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 0.5, mb: 1, minWidth: 0 }}>
        <Button
          component={RouterLink}
          to="/dashboard"
          size="small"
          sx={{ minWidth: 0, px: 1, color: "text.secondary", flexShrink: 0 }}
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Submissions
        </Typography>
      </Box>

      <Box sx={{ ...sectionCardSx, ...sectionContentSx, mb: 1.5, flexShrink: 0 }}>
        {activityQuery.isLoading ? (
          <LoadingSkeleton variant="detail" />
        ) : activityQuery.isError ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Could not load activity.
          </Alert>
        ) : activityQuery.data ? (
          <SubmissionActivityHeatmap
            activity={activityQuery.data}
            selection={activitySelection}
            onSelectionChange={setActivitySelection}
          />
        ) : null}
      </Box>

      <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0, width: "100%", minWidth: 0 }}>
        <Grid size={{ xs: 12, md: 2.5, lg: 2 }} sx={{ minHeight: 0, height: "100%", display: "flex" }}>
          <SectionCard
            title="Filters"
            scroll
            sx={{ flex: 1, minHeight: 0, height: "100%" }}
            bodySx={{ pt: 0.5, pb: 1.5 }}
          >
            <FilterGroup title="Verdict">
              {VERDICT_FILTERS.map((f) => (
                <FilterOption
                  key={f.value}
                  label={f.label}
                  active={verdict === f.value}
                  onClick={() => {
                    setVerdict(f.value);
                    setPage(1);
                  }}
                />
              ))}
            </FilterGroup>
            <Divider sx={{ my: 1 }} />
            <FilterGroup title="Language">
              {LANGUAGE_FILTERS.map((lang) => (
                <FilterOption
                  key={lang}
                  label={lang === "ALL" ? "All" : lang}
                  active={language === lang}
                  onClick={() => {
                    setLanguage(lang);
                    setPage(1);
                  }}
                />
              ))}
            </FilterGroup>
          </SectionCard>
        </Grid>

        <Grid
          size={{ xs: 12, md: 9.5, lg: 10 }}
          sx={{ minHeight: 0, height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}
        >
          <SectionCard
            title="Recent runs"
            titleAdornment={
              submissionsQuery.data ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {submissionsQuery.data.total}
                </Typography>
              ) : undefined
            }
            scroll
            sx={{ flex: 1, minHeight: 0, height: "100%", display: "flex", flexDirection: "column" }}
            bodySx={{ py: 0 }}
          >
            {submissionsQuery.isLoading ? (
              <Box sx={{ px: sectionInsetX, py: 1.5 }}>
                <LoadingSkeleton variant="list" count={8} />
              </Box>
            ) : submissionsQuery.isError ? (
              <Alert severity="error" sx={{ mx: sectionInsetX, my: 1.5 }}>
                {submissionsQuery.error.message}
              </Alert>
            ) : submissions.length === 0 ? (
              <EmptyState title="No submissions" description="Adjust filters or solve a problem." />
            ) : (
              submissions.map((s, i) => (
                <SubmissionHistoryRow
                  key={s.id}
                  submission={s}
                  isLast={i === submissions.length - 1}
                />
              ))
            )}
          </SectionCard>

          {totalPages > 1 && !submissionsQuery.isLoading && (
            <Box
              sx={{
                flexShrink: 0,
                mt: 1,
                px: sectionInsetX,
                py: 1,
                borderRadius: 2,
                bgcolor: miui.paper,
                border: `1px solid ${miui.border}`,
                display: "flex",
                justifyContent: "flex-end",
                boxSizing: "border-box",
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </FixedPageShell>
  );
}
