import { Alert, Box, Typography } from "@mui/material";
import type { ActivityYearSelection } from "@/components/submissions/SubmissionActivityHeatmap";
import { SubmissionActivityHeatmap } from "@/components/submissions/SubmissionActivityHeatmap";
import { SolvedProgressPanel } from "@/components/submissions/SolvedProgressPanel";
import type { ProblemCatalogStats, SolvedDifficultyStats, SubmissionActivitySummary } from "@/types/api.types";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { miui, sectionCardSx } from "@/theme/theme";

type SubmissionOverviewSectionProps = {
  solved: SolvedDifficultyStats | undefined;
  catalog: ProblemCatalogStats | undefined;
  solvedLoading: boolean;
  activity: SubmissionActivitySummary | undefined;
  activityLoading: boolean;
  activityError: boolean;
  activitySelection: ActivityYearSelection;
  onActivitySelectionChange: (value: ActivityYearSelection) => void;
};

export function SubmissionOverviewSection({
  solved,
  catalog,
  solvedLoading,
  activity,
  activityLoading,
  activityError,
  activitySelection,
  onActivitySelectionChange,
}: SubmissionOverviewSectionProps) {
  return (
    <Box
      sx={{
        ...sectionCardSx,
        flexShrink: 0,
        p: { xs: 1.5, sm: 2 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(300px, 360px) minmax(0, 1fr)" },
        gap: { xs: 2, md: 2.5 },
        alignItems: "stretch",
        minWidth: 0,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
            fontSize: "0.62rem",
            mb: 1,
            display: "block",
          }}
        >
          Progress
        </Typography>
        <SolvedProgressPanel solved={solved} catalog={catalog} loading={solvedLoading} />
      </Box>

      <Box
        sx={{
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          borderLeft: { md: `1px solid ${miui.border}` },
          pl: { md: 2.5 },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
            fontSize: "0.62rem",
            mb: 1,
            display: "block",
          }}
        >
          Activity
        </Typography>
        {activityLoading ? (
          <LoadingSkeleton variant="detail" />
        ) : activityError ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Could not load activity.
          </Alert>
        ) : activity ? (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SubmissionActivityHeatmap
              activity={activity}
              selection={activitySelection}
              onSelectionChange={onActivitySelectionChange}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
