import { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import type { BrainCacheRevisionTask } from "@/types/brainCache.types";
import { BrainCacheRevisionRow } from "@/components/brainCache/BrainCacheRevisionRow";
import { formatOverdueDayLabel, getUtcDateKey, utcDaysBeforeToday } from "@/utils/date";
import { miui, monoStatSx } from "@/theme/theme";

const LIST_MAX = 360;

function sortedDates(tasks: BrainCacheRevisionTask[]): string[] {
  return [...new Set(tasks.map((t) => t.dueDate))].sort((a, b) => b.localeCompare(a));
}

type BrainCacheRevisionsPanelProps = {
  variant: "today" | "overdue";
  title: string;
  tasks: BrainCacheRevisionTask[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  busy?: boolean;
  paginateByDay?: boolean;
  emptyMessage: string;
};

export function BrainCacheRevisionsPanel({
  variant,
  title,
  tasks,
  onComplete,
  onSkip,
  busy = false,
  paginateByDay = false,
  emptyMessage,
}: BrainCacheRevisionsPanelProps) {
  const todayKey = getUtcDateKey();
  const accent = variant === "overdue" ? miui.danger : miui.accent;
  const dates = useMemo(() => sortedDates(tasks), [tasks]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [dates.join("|")]);

  useEffect(() => {
    if (pageIndex >= dates.length && dates.length > 0) setPageIndex(0);
  }, [pageIndex, dates.length]);

  const visibleTasks = useMemo(() => {
    if (!paginateByDay || dates.length === 0) return tasks;
    const active = dates[pageIndex];
    return active === undefined ? [] : tasks.filter((t) => t.dueDate === active);
  }, [tasks, paginateByDay, dates, pageIndex]);

  const activeDate = dates[pageIndex];
  const countLabel =
    paginateByDay && activeDate !== undefined
      ? `${visibleTasks.length} items · ${formatOverdueDayLabel(activeDate, todayKey)}`
      : `${tasks.length} items`;

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Box
        sx={{
          bgcolor: miui.elevated,
          borderRadius: "8px 8px 0 0",
          borderLeft: `3px solid ${accent}`,
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 600,
            fontSize: "13px",
            color: miui.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {title}
        </Typography>
        <Typography
          component="span"
          sx={{
            ...monoStatSx,
            fontSize: "12px",
            fontWeight: 400,
            color: miui.textMuted,
            bgcolor: miui.paper,
            border: `1px solid ${miui.border}`,
            borderRadius: "999px",
            px: 1,
            py: 0.25,
          }}
        >
          {countLabel}
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: miui.paper,
          border: `1px solid ${miui.border}`,
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          minHeight: 80,
          overflow: "hidden",
        }}
      >
        {tasks.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
              px: 2,
              gap: 1,
            }}
          >
            <EventAvailableRoundedIcon sx={{ fontSize: 28, color: miui.textDim }} />
            <Typography variant="body2" sx={{ color: miui.textMuted, fontWeight: 400, textAlign: "center" }}>
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <>
            <Box className="app-scroll" sx={{ maxHeight: LIST_MAX, overflowY: "auto" }}>
              {visibleTasks.map((task, i) => {
                const daysOverdue =
                  variant === "overdue" ? utcDaysBeforeToday(task.dueDate, todayKey) : undefined;
                return (
                  <BrainCacheRevisionRow
                    key={task.id}
                    task={task}
                    variant={variant}
                    daysOverdue={daysOverdue}
                    onComplete={onComplete}
                    onSkip={onSkip}
                    busy={busy}
                    isLast={i === visibleTasks.length - 1}
                  />
                );
              })}
            </Box>
            {paginateByDay && dates.length > 1 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1,
                  py: 0.75,
                  borderTop: `1px solid ${miui.border}`,
                }}
              >
                <IconButton size="small" disabled={pageIndex <= 0} onClick={() => setPageIndex((p) => p - 1)}>
                  <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ color: miui.textMuted, fontWeight: 400 }}>
                  {pageIndex + 1} / {dates.length}
                </Typography>
                <IconButton
                  size="small"
                  disabled={pageIndex >= dates.length - 1}
                  onClick={() => setPageIndex((p) => Math.min(dates.length - 1, p + 1))}
                >
                  <ChevronRightRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : null}
          </>
        )}
      </Box>
    </Box>
  );
}
