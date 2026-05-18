import { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { BrainCacheRevisionTask } from "@/types/brainCache.types";
import { BrainCacheRevisionRow } from "@/components/brainCache/BrainCacheRevisionRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatOverdueDayLabel, getUtcDateKey } from "@/utils/date";
import { sectionContentSx } from "@/theme/theme";

const LIST_MAX = 280;

function sortedDates(tasks: BrainCacheRevisionTask[]): string[] {
  return [...new Set(tasks.map((t) => t.dueDate))].sort((a, b) => b.localeCompare(a));
}

type BrainCacheRevisionsPanelProps = {
  title: string;
  tasks: BrainCacheRevisionTask[];
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  busy?: boolean;
  paginateByDay?: boolean;
  emptyMessage: string;
  accentBorder?: string;
};

export function BrainCacheRevisionsPanel({
  title,
  tasks,
  onComplete,
  onSkip,
  busy = false,
  paginateByDay = false,
  emptyMessage,
  accentBorder,
}: BrainCacheRevisionsPanelProps) {
  const todayKey = getUtcDateKey();
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
  const subtitle =
    paginateByDay && activeDate !== undefined
      ? `${formatOverdueDayLabel(activeDate, todayKey)} · ${visibleTasks.length}`
      : `${tasks.length} items`;

  return (
    <SectionCard
      title={title}
      titleAdornment={
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {subtitle}
        </Typography>
      }
      sx={accentBorder ? { borderLeft: `3px solid ${accentBorder}` } : undefined}
      bodySx={{ ...sectionContentSx, py: 0, px: 0 }}
    >
      {tasks.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 2 }}>
          {emptyMessage}
        </Typography>
      ) : (
        <>
          <Box sx={{ maxHeight: LIST_MAX, overflowY: "auto" }}>
            {visibleTasks.map((task, i) => (
              <BrainCacheRevisionRow
                key={task.id}
                task={task}
                onComplete={onComplete}
                onSkip={onSkip}
                busy={busy}
                isLast={i === visibleTasks.length - 1}
              />
            ))}
          </Box>
          {paginateByDay && dates.length > 1 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 0.75,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <IconButton size="small" disabled={pageIndex <= 0} onClick={() => setPageIndex((p) => p - 1)}>
                <ChevronLeftRoundedIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
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
    </SectionCard>
  );
}
