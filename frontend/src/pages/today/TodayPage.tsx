import { useMemo } from "react";
import { Alert, Box, Button, LinearProgress, Link, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { FadeInCard } from "@/components/ui/FadeInCard";
import { motion } from "framer-motion";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { FixedPageShell, ScrollRegion } from "@/components/layout/FixedPageShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatsStrip } from "@/components/ui/StatsStrip";
import { OverduePaginatedPanel } from "@/components/learning/OverduePaginatedPanel";
import { ScheduleAssignmentGroup } from "@/components/learning/ScheduleAssignmentGroup";
import { TodayPotdEnrollBanner, TodayPotdHero } from "@/components/learning/TodayPotdHero";
import { DueCalendar } from "@/features/due-calendar/DueCalendar";
import { learningService } from "@/services/learning.service";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { TrackedAssignment } from "@/types/api.types";
import { dashNavTabSx, miui, sectionCardSx, sectionContentSx, monoStatSx } from "@/theme/theme";
import { getUtcDateKey } from "@/utils/date";
import dayjs from "dayjs";

function groupBySchedule(items: TrackedAssignment[]) {
  const map = new Map<
    string,
    { scheduleName: string; scheduleType: TrackedAssignment["scheduleType"]; items: TrackedAssignment[] }
  >();
  for (const a of items) {
    const key = a.userScheduleId;
    const entry = map.get(key);
    if (entry) {
      entry.items.push(a);
    } else {
      map.set(key, {
        scheduleName: a.scheduleName,
        scheduleType: a.scheduleType,
        items: [a],
      });
    }
  }
  return [...map.values()];
}

type TodayTab = "queue" | "timeline";

function readTab(value: string | null): TodayTab {
  return value === "timeline" ? "timeline" : "queue";
}

export function TodayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = readTab(searchParams.get("tab"));
  const timelineDate = searchParams.get("date") ?? undefined;

  const todayLabel = dayjs().format("ddd, MMM D");
  const todayDateKey = getUtcDateKey();

  const todayQuery = useQuery({
    queryKey: queryKeys.trackedToday(todayDateKey),
    queryFn: learningService.getTodayAssignments,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const dueQuery = useQuery({
    queryKey: queryKeys.trackedDue(todayDateKey),
    queryFn: learningService.getDueAssignments,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.userSchedules,
    queryFn: schedulesService.listUserSchedules,
  });

  const assignments = todayQuery.data?.assignments ?? [];
  const due = dueQuery.data?.assignments ?? [];

  const pending = assignments.filter((a) => a.status === "PENDING");
  const solved = assignments.filter((a) => a.status === "SOLVED");
  const totalToday = assignments.length;
  const progressPct = totalToday > 0 ? Math.round((solved.length / totalToday) * 100) : 0;

  const potdToday = useMemo(
    () =>
      assignments.filter(
        (a) => a.scheduleType === "DAILY_POTD" && a.assignedDate === todayDateKey,
      ),
    [assignments, todayDateKey],
  );
  const potdPending = potdToday.filter((a) => a.status === "PENDING");
  const potdHeroAssignment = potdPending[0] ?? potdToday[0];
  const planPending = pending.filter((a) => a.scheduleType !== "DAILY_POTD");
  const planPendingBySchedule = useMemo(() => groupBySchedule(planPending), [planPending]);

  const potdEnrolled =
    schedulesQuery.data?.some((s) => s.active && s.template.type === "DAILY_POTD") ?? false;

  const allClear = pending.length === 0 && due.length === 0;

  const oldestOverdueDate = useMemo(() => {
    if (due.length === 0) return undefined;
    return [...due].map((a) => a.assignedDate).sort((a, b) => a.localeCompare(b))[0];
  }, [due]);

  const setTab = (next: TodayTab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "queue") {
      params.delete("tab");
      params.delete("date");
    } else {
      params.set("tab", "timeline");
    }
    setSearchParams(params, { replace: true });
  };

  const timelineLink = (date?: string) => {
    const params = new URLSearchParams();
    params.set("tab", "timeline");
    if (date !== undefined) {
      params.set("date", date);
    }
    return `/today?${params.toString()}`;
  };

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
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Today
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {todayLabel} · focus on what&apos;s left to do
          </Typography>
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{ flexShrink: 0, mb: 1.5, borderBottom: `1px solid ${miui.border}` }}
      >
        <Button variant="text" size="small" onClick={() => setTab("queue")} sx={dashNavTabSx(tab === "queue")}>
          Queue
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => setTab("timeline")}
          sx={dashNavTabSx(tab === "timeline")}
        >
          Due Timeline
        </Button>
      </Stack>

      <ScrollRegion sx={{ pb: 0.5 }}>
        {tab === "timeline" ? (
          <DueCalendar
            initialDate={timelineDate}
            onSelectedDateChange={(date) => {
              const params = new URLSearchParams(searchParams);
              params.set("tab", "timeline");
              params.set("date", date);
              setSearchParams(params, { replace: true });
            }}
          />
        ) : todayQuery.isLoading ? (
          <LoadingSkeleton variant="detail" />
        ) : (
          <>
            {potdHeroAssignment !== undefined ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <TodayPotdHero assignment={potdHeroAssignment} />
              </motion.div>
            ) : (
              <TodayPotdEnrollBanner enrolled={potdEnrolled} />
            )}

            {totalToday > 0 && (
              <Box
                sx={{
                  ...sectionCardSx,
                  ...sectionContentSx,
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75, gap: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap>
                    Today&apos;s queue {solved.length}/{totalToday} done
                  </Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800, flexShrink: 0 }}>
                    {progressPct}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: miui.elevated,
                  }}
                />
              </Box>
            )}

            <StatsStrip
              items={[
                { label: "To do", value: pending.length, variant: "todo" },
                { label: "Overdue", value: due.length, variant: "overdue", pulse: true },
                { label: "Done today", value: solved.length, variant: "done" },
              ]}
            />

            {allClear ? (
              <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
                No reps today. You&apos;re ahead of schedule. See past work under{" "}
                <Typography
                  component={RouterLink}
                  to="/submissions"
                  variant="inherit"
                  sx={{ fontWeight: 700, color: "inherit" }}
                >
                  Submissions
                </Typography>
                .
              </Alert>
            ) : null}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" },
                gap: 1.5,
                width: "100%",
                minWidth: 0,
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  bgcolor: miui.paper,
                  border: `1px solid ${miui.border}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderBottom: planPending.length > 0 ? `1px solid ${miui.border}` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>Study plans</Typography>
                  <Typography variant="caption" sx={{ color: miui.textMuted, fontWeight: 400 }}>
                    {planPending.length}
                  </Typography>
                </Box>
                {planPending.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 2 }}>
                    {potdPending.length > 0
                      ? "No other plans due today — focus on today's POTD above."
                      : "No study-plan items left for today."}
                  </Typography>
                ) : (
                  planPendingBySchedule.map((group, gi) => (
                    <FadeInCard key={group.scheduleName} delay={gi * 0.1}>
                      <ScheduleAssignmentGroup
                        scheduleName={group.scheduleName}
                        scheduleType={group.scheduleType}
                        assignments={group.items}
                      />
                    </FadeInCard>
                  ))
                )}
              </Box>

              <Box
                sx={{
                  bgcolor: miui.paper,
                  border: `1px solid ${miui.dangerBorder}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  maxHeight: { lg: 480 },
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    bgcolor: miui.dangerDim,
                    px: 2,
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "11px",
                      fontWeight: 400,
                      color: miui.danger,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Overdue
                  </Typography>
                  <Box
                    sx={{
                      ...monoStatSx,
                      fontSize: "12px",
                      fontWeight: 400,
                      px: "8px",
                      py: "2px",
                      borderRadius: "4px",
                      bgcolor: miui.dangerDim,
                      border: `1px solid ${miui.dangerBorder}`,
                      color: miui.danger,
                      flexShrink: 0,
                    }}
                  >
                    {due.length}
                  </Box>
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                  <OverduePaginatedPanel assignments={due} isLoading={dueQuery.isLoading} />
                </Box>
                {due.length > 0 && oldestOverdueDate !== undefined ? (
                  <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${miui.border}`, flexShrink: 0 }}>
                    <Link
                      component={RouterLink}
                      to={timelineLink(oldestOverdueDate)}
                      variant="body2"
                      sx={{ fontWeight: 500, fontSize: "0.8125rem", color: miui.accent }}
                    >
                      View by date →
                    </Link>
                  </Box>
                ) : null}
              </Box>
            </Box>
          </>
        )}
      </ScrollRegion>
    </FixedPageShell>
  );
}
