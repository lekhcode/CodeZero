import { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Typography, alpha } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { ScheduleAssignmentGroup } from "@/components/learning/ScheduleAssignmentGroup";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { TrackedAssignment } from "@/types/api.types";
import { formatOverdueDayLabel, getUtcDateKey } from "@/utils/date";
import { miui, sectionInsetX } from "@/theme/theme";

const OVERDUE_LIST_MAX_HEIGHT = 280;

function groupBySchedule(items: TrackedAssignment[]) {
  const map = new Map<
    string,
    { scheduleName: string; scheduleType: TrackedAssignment["scheduleType"]; items: TrackedAssignment[] }
  >();
  for (const a of items) {
    const entry = map.get(a.userScheduleId);
    if (entry) {
      entry.items.push(a);
    } else {
      map.set(a.userScheduleId, {
        scheduleName: a.scheduleName,
        scheduleType: a.scheduleType,
        items: [a],
      });
    }
  }
  return [...map.values()];
}

function sortedOverdueDates(items: TrackedAssignment[]): string[] {
  return [...new Set(items.map((a) => a.assignedDate))].sort((a, b) => b.localeCompare(a));
}

type OverduePaginatedPanelProps = {
  assignments: TrackedAssignment[];
  isLoading?: boolean;
};

/** One calendar day per page — newest overdue first; scroll within a busy day. */
export function OverduePaginatedPanel({ assignments, isLoading = false }: OverduePaginatedPanelProps) {
  const todayKey = getUtcDateKey();
  const sortedDates = useMemo(() => sortedOverdueDates(assignments), [assignments]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [sortedDates.join("|")]);

  useEffect(() => {
    if (pageIndex >= sortedDates.length && sortedDates.length > 0) {
      setPageIndex(0);
    }
  }, [pageIndex, sortedDates.length]);

  const activeDate = sortedDates[pageIndex];
  const pageItems = useMemo(
    () => (activeDate === undefined ? [] : assignments.filter((a) => a.assignedDate === activeDate)),
    [assignments, activeDate],
  );
  const groups = useMemo(() => groupBySchedule(pageItems), [pageItems]);

  const canGoNewer = pageIndex > 0;
  const canGoOlder = pageIndex < sortedDates.length - 1;
  const dayLabel =
    activeDate !== undefined ? formatOverdueDayLabel(activeDate, todayKey) : "";

  if (isLoading) {
    return <LoadingSkeleton variant="list" count={3} />;
  }

  if (assignments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        No overdue problems.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
      <Box
        sx={{
          px: sectionInsetX,
          py: 0.75,
          mb: 0.5,
          borderRadius: 1.5,
          bgcolor: alpha("#EF4444", 0.08),
          border: `1px solid ${alpha("#EF4444", 0.2)}`,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
          Showing overdue for
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#B91C1C", lineHeight: 1.3 }}>
          {dayLabel}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
          {pageItems.length} problem{pageItems.length === 1 ? "" : "s"} · day {pageIndex + 1} of{" "}
          {sortedDates.length}
        </Typography>
      </Box>

      <Box
        sx={{
          maxHeight: OVERDUE_LIST_MAX_HEIGHT,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          minHeight: 0,
          pr: 0.25,
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 4,
            bgcolor: alpha(miui.text, 0.15),
          },
        }}
      >
        {groups.map((group) => (
          <ScheduleAssignmentGroup
            key={`due-${activeDate}-${group.scheduleName}`}
            scheduleName={group.scheduleName}
            scheduleType={group.scheduleType}
            assignments={group.items}
            variant="overdue"
          />
        ))}
      </Box>

      {sortedDates.length > 1 ? (
        <Box
          sx={{
            mt: 1,
            pt: 1,
            px: 0.5,
            borderTop: `1px solid ${miui.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.5,
          }}
        >
          <IconButton
            size="small"
            disabled={!canGoNewer}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            aria-label="More recent overdue day"
            sx={{ color: canGoNewer ? "primary.main" : "text.disabled" }}
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, textAlign: "center", flex: 1, minWidth: 0 }}
          >
            {pageIndex + 1} / {sortedDates.length}
            {canGoOlder && sortedDates[pageIndex + 1] !== undefined
              ? ` · next: ${formatOverdueDayLabel(sortedDates[pageIndex + 1], todayKey)}`
              : ""}
          </Typography>
          <IconButton
            size="small"
            disabled={!canGoOlder}
            onClick={() => setPageIndex((p) => Math.min(sortedDates.length - 1, p + 1))}
            aria-label="Older overdue day"
            sx={{ color: canGoOlder ? "primary.main" : "text.disabled" }}
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}
