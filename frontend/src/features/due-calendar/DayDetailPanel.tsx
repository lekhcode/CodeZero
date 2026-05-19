import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { DueCalendarDayResponse, DueItem } from "./due-calendar.types";
import { miui, monoStatSx } from "@/theme/theme";

const STATUS_STYLES = {
  completed: { bg: miui.successDim, color: miui.success, label: "✓ Done" },
  "completed-late": { bg: miui.warningDim, color: miui.warning, label: "Done late" },
  overdue: { bg: miui.dangerDim, color: miui.danger, label: "Overdue" },
  skipped: { bg: miui.elevated, color: miui.textMuted, label: "Skipped" },
} as const;

function statusLabel(item: DueItem): string {
  const base = STATUS_STYLES[item.status];
  if (item.status === "overdue" && item.daysOverdue !== undefined && item.daysOverdue > 0) {
    return `${item.daysOverdue} day${item.daysOverdue === 1 ? "" : "s"} overdue`;
  }
  if (item.status === "overdue") {
    return "Due";
  }
  return base.label;
}

function SectionHeader({ label, variant }: { label: string; variant: "assignment" | "brain-cache" }) {
  const isAssignment = variant === "assignment";
  return (
    <Typography
      component="span"
      sx={{
        display: "inline-block",
        px: 1,
        py: 0.35,
        borderRadius: 1,
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        bgcolor: isAssignment ? miui.accentDim : miui.infoDim,
        color: isAssignment ? miui.primary : miui.info,
      }}
    >
      {label}
    </Typography>
  );
}

function DueItemRow({ item }: { item: DueItem }) {
  const status = STATUS_STYLES[item.status];
  const showCta = item.status === "overdue" || item.status === "skipped";
  const difficultyKey = item.difficulty.toUpperCase();

  return (
    <Box
      sx={{
        py: 1.25,
        borderBottom: `1px solid ${miui.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 500,
              fontSize: "0.9375rem",
              lineHeight: 1.3,
            }}
          >
            {item.problemTitle}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: miui.textMuted, mt: 0.25 }}>
            {item.sourceName}
          </Typography>
        </Box>
        <DifficultyChip difficulty={difficultyKey} />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Typography
          component="span"
          sx={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            px: 0.75,
            py: 0.25,
            borderRadius: 0.75,
            bgcolor: status.bg,
            color: status.color,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {statusLabel(item)}
        </Typography>
        {showCta ? (
          <Button
            component={RouterLink}
            to={`/problems/${item.problemSlug}`}
            variant="outlined"
            size="small"
            sx={{ minWidth: 0, py: 0.35, fontSize: "0.75rem" }}
          >
            Solve now →
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

type DayDetailPanelProps = {
  selectedDate: string;
  data: DueCalendarDayResponse | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function DayDetailPanel({ selectedDate, data, isLoading, isError }: DayDetailPanelProps) {
  const headerDate = new Date(`${selectedDate}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const items = data?.items ?? [];
  const assignments = items.filter((i) => i.source === "assignment");
  const revisions = items.filter((i) => i.source === "brain-cache");

  const totalDue = items.length;
  const completed = items.filter((i) => i.status === "completed" || i.status === "completed-late").length;
  const overdue = items.filter((i) => i.status === "overdue").length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, minWidth: 0 }}>
      <Box sx={{ flexShrink: 0, mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, lineHeight: 1.25 }}
        >
          {headerDate}
        </Typography>
        <Typography sx={{ ...monoStatSx, fontSize: "0.8125rem", color: miui.textMuted, mt: 0.5 }}>
          {totalDue} due · {completed} completed · {overdue} overdue
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : isError ? (
          <Typography variant="body2" color="error">
            Could not load this day.
          </Typography>
        ) : items.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 6 }}
          >
            Nothing was scheduled for this day.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {assignments.length > 0 ? (
              <Box>
                <Box sx={{ mb: 1 }}>
                  <SectionHeader label="Assignments" variant="assignment" />
                </Box>
                {assignments.map((item) => (
                  <DueItemRow key={item.id} item={item} />
                ))}
              </Box>
            ) : null}

            {revisions.length > 0 ? (
              <Box>
                <Box sx={{ mb: 1 }}>
                  <SectionHeader label="Brain Cache Revisions" variant="brain-cache" />
                </Box>
                {revisions.map((item) => (
                  <DueItemRow key={item.id} item={item} />
                ))}
              </Box>
            ) : null}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
