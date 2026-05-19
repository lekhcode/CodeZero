import { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { ScheduleAssignmentGroup } from "@/components/learning/ScheduleAssignmentGroup";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { TrackedAssignment } from "@/types/api.types";
import { formatOverdueDayLabel, getUtcDateKey } from "@/utils/date";
import { miui, monoStatSx } from "@/theme/theme";

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
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 2 }}>
        Backlog clear. Discipline is showing.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          borderBottom: `1px solid ${miui.border}`,
        }}
      >
        <Typography sx={{ fontSize: "13px", fontWeight: 400, color: miui.textMuted }}>
          For {dayLabel.toLowerCase()}
        </Typography>
        {sortedDates.length > 1 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <IconButton
              size="small"
              disabled={!canGoNewer}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              aria-label="More recent overdue day"
              sx={{ color: canGoNewer ? miui.accent : miui.textDim }}
            >
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
            <Typography
              sx={{
                ...monoStatSx,
                fontSize: "10px",
                color: miui.textMuted,
                minWidth: 48,
                textAlign: "center",
              }}
            >
              {pageIndex + 1}/{sortedDates.length}
            </Typography>
            <IconButton
              size="small"
              disabled={!canGoOlder}
              onClick={() => setPageIndex((p) => Math.min(sortedDates.length - 1, p + 1))}
              aria-label="Older overdue day"
              sx={{ color: canGoOlder ? miui.accent : miui.textDim }}
            >
              <ChevronRightRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : null}
      </Box>

      <Box
        sx={{
          maxHeight: OVERDUE_LIST_MAX_HEIGHT,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          minHeight: 0,
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 4,
            bgcolor: miui.borderStrong,
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
    </Box>
  );
}
