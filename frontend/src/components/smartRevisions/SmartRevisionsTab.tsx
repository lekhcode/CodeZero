import { useState, type ReactNode } from "react";
import {
  Box,
  Collapse,
  LinearProgress,
  Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "@/components/ui/SectionCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { AutoRevisionProblemCard } from "@/components/smartRevisions/AutoRevisionProblemCard";
import { WeekNavigator } from "@/components/smartRevisions/WeekNavigator";
import { MonthNavigator } from "@/components/smartRevisions/MonthNavigator";
import { autoRevisionService } from "@/services/autoRevision.service";
import { autoRevisionKeyPrefix, queryKeys } from "@/hooks/queryKeys";
import type { AutoRevisionItem } from "@/types/autoRevision.types";
import { getClientTimezone } from "@/utils/timezone";
import { bc } from "@/components/brainCache/brainCacheTheme";
import { miui, sectionContentSx } from "@/theme/theme";

function SummaryRow({
  icon,
  label,
  pending,
  open,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  pending: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        py: 1.25,
        px: 0,
        border: "none",
        bgcolor: "transparent",
        cursor: "pointer",
        color: miui.text,
        textAlign: "left",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 1,
            bgcolor: miui.accentSoft,
            color: miui.accent,
            flexShrink: 0,
            "& .MuiSvgIcon-root": { fontSize: 17 },
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>{label}</Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          sx={{
            fontFamily: "var(--font-number)",
            fontSize: "12px",
            color: pending > 0 ? bc.danger : miui.textMuted,
          }}
        >
          [{pending} pending]
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            fontSize: 20,
            color: miui.textMuted,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 180ms ease",
          }}
        />
      </Box>
    </Box>
  );
}

function ProgressBar({ revised, total }: { revised: number; total: number }) {
  const pct = total === 0 ? 100 : Math.round((revised / total) * 100);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {revised} / {total} revised
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {pct}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: miui.elevated,
          "& .MuiLinearProgress-bar": { bgcolor: miui.accent },
        }}
      />
    </Box>
  );
}

function RevisionList({ items, onRevise, busy }: { items: AutoRevisionItem[]; onRevise: (id: string, slug: string) => void; busy: boolean }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 1.5 }}>
        Nothing scheduled in this bucket.
      </Typography>
    );
  }
  return (
    <Box>
      {items.map((item) => (
        <AutoRevisionProblemCard key={item.id} item={item} onRevise={onRevise} busy={busy} />
      ))}
    </Box>
  );
}

export function SmartRevisionsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tz = getClientTimezone();

  const [openToday, setOpenToday] = useState(true);
  const [openWeek, setOpenWeek] = useState(false);
  const [openMonth, setOpenMonth] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const summaryQuery = useQuery({
    queryKey: queryKeys.autoRevisionSummary(tz),
    queryFn: () => autoRevisionService.summary(tz),
  });

  const todayQuery = useQuery({
    queryKey: queryKeys.autoRevisionToday(tz),
    queryFn: () => autoRevisionService.today(tz),
    enabled: openToday,
  });

  const weekQuery = useQuery({
    queryKey: queryKeys.autoRevisionWeek(weekOffset, tz),
    queryFn: () => autoRevisionService.week(weekOffset, tz),
    enabled: openWeek,
  });

  const monthQuery = useQuery({
    queryKey: queryKeys.autoRevisionMonth(monthOffset, tz),
    queryFn: () => autoRevisionService.month(monthOffset, tz),
    enabled: openMonth,
  });

  const markMutation = useMutation({
    mutationFn: (id: string) => autoRevisionService.markRevised(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: autoRevisionKeyPrefix });
    },
  });

  const handleRevise = (id: string, slug: string) => {
    navigate(`/problems/${slug}?autoRevisionId=${encodeURIComponent(id)}`);
  };

  /** D+1 only — yesterday's solve appears here today. */
  const todayItems = todayQuery.data?.daily ?? [];

  const summary = summaryQuery.data;

  if (summaryQuery.isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SectionCard title="Smart Revisions" bodySx={{ ...sectionContentSx, pt: 1.5, pb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Each solve schedules one daily (tomorrow), one weekly (that week&apos;s Saturday), and one
          month-end revision — each shown in its own section below.
        </Typography>

        <SummaryRow
          icon={<CalendarTodayRoundedIcon />}
          label="Today's revisions"
          pending={summary?.todayPending ?? 0}
          open={openToday}
          onToggle={() => setOpenToday((v) => !v)}
        />
        <Collapse in={openToday}>
          {todayQuery.isLoading ? (
            <LoadingSkeleton variant="list" />
          ) : (
            <RevisionList items={todayItems} onRevise={handleRevise} busy={markMutation.isPending} />
          )}
        </Collapse>

        <Box sx={{ borderTop: `1px solid ${miui.border}`, mt: 1.5, pt: 1.5 }}>
          <SummaryRow
            icon={<DateRangeRoundedIcon />}
            label="This week"
            pending={summary?.weekPending ?? 0}
            open={openWeek}
            onToggle={() => setOpenWeek((v) => !v)}
          />
          <Collapse in={openWeek}>
            {weekQuery.data ? (
              <>
                <WeekNavigator
                  label={weekQuery.data.weekRange.label}
                  weekOffset={weekOffset}
                  onChange={setWeekOffset}
                  disableNext={weekOffset >= 0}
                />
                <ProgressBar
                  revised={weekQuery.data.totalRevised}
                  total={weekQuery.data.totalScheduled}
                />
                <RevisionList
                  items={weekQuery.data.problems}
                  onRevise={handleRevise}
                  busy={markMutation.isPending}
                />
              </>
            ) : weekQuery.isLoading ? (
              <LoadingSkeleton variant="list" />
            ) : null}
          </Collapse>
        </Box>

        <Box sx={{ borderTop: `1px solid ${miui.border}`, mt: 1.5, pt: 1.5 }}>
          <SummaryRow
            icon={<CalendarMonthRoundedIcon />}
            label="This month"
            pending={summary?.monthPending ?? 0}
            open={openMonth}
            onToggle={() => setOpenMonth((v) => !v)}
          />
          <Collapse in={openMonth}>
            {monthQuery.data ? (
              <>
                <MonthNavigator
                  label={monthQuery.data.monthLabel}
                  monthOffset={monthOffset}
                  onChange={setMonthOffset}
                  disableNext={monthOffset >= 0}
                />
                <ProgressBar
                  revised={monthQuery.data.totalRevised}
                  total={monthQuery.data.totalScheduled}
                />
                <RevisionList
                  items={monthQuery.data.problems}
                  onRevise={handleRevise}
                  busy={markMutation.isPending}
                />
              </>
            ) : monthQuery.isLoading ? (
              <LoadingSkeleton variant="list" />
            ) : null}
          </Collapse>
        </Box>
      </SectionCard>
    </Box>
  );
}
