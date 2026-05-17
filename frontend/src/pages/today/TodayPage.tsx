import { useMemo } from "react";
import { Alert, Box, Button, LinearProgress, Typography, alpha } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { FixedPageShell, ScrollRegion } from "@/components/layout/FixedPageShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatsStrip } from "@/components/ui/StatsStrip";
import { ScheduleAssignmentGroup } from "@/components/learning/ScheduleAssignmentGroup";
import { TodayPotdEnrollBanner, TodayPotdHero } from "@/components/learning/TodayPotdHero";
import { learningService } from "@/services/learning.service";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { TrackedAssignment } from "@/types/api.types";
import { labAccentGradient, miui, sectionCardSx, sectionContentSx } from "@/theme/theme";
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

export function TodayPage() {
  const todayLabel = dayjs().format("ddd, MMM D");

  const todayQuery = useQuery({
    queryKey: queryKeys.trackedToday,
    queryFn: learningService.getTodayAssignments,
  });

  const dueQuery = useQuery({
    queryKey: queryKeys.trackedDue,
    queryFn: learningService.getDueAssignments,
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

  const potdPending = pending.filter((a) => a.scheduleType === "DAILY_POTD");
  const planPending = pending.filter((a) => a.scheduleType !== "DAILY_POTD");
  const planPendingBySchedule = useMemo(() => groupBySchedule(planPending), [planPending]);
  const dueBySchedule = useMemo(() => groupBySchedule(due), [due]);

  const potdEnrolled =
    schedulesQuery.data?.some((s) => s.active && s.template.type === "DAILY_POTD") ?? false;

  const allClear = pending.length === 0 && due.length === 0;

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
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Today
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {todayLabel} · focus on what&apos;s left to do
          </Typography>
        </Box>
      </Box>

      <ScrollRegion sx={{ pb: 0.5 }}>
        {todayQuery.isLoading ? (
          <LoadingSkeleton variant="detail" />
        ) : (
          <>
            {potdPending[0] !== undefined ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <TodayPotdHero assignment={potdPending[0]} />
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
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(miui.primary, 0.1),
                    "& .MuiLinearProgress-bar": { borderRadius: 3, background: labAccentGradient },
                  }}
                />
              </Box>
            )}

            <StatsStrip
              items={[
                { label: "To do", value: pending.length, color: miui.accent },
                { label: "Overdue", value: due.length, color: "#EF4444" },
                {
                  label: "Done today",
                  value: solved.length,
                  color: solved.length > 0 ? "#22C55E" : undefined,
                },
              ]}
            />

            {allClear ? (
              <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
                You&apos;re caught up — nothing left on Today. See past work under{" "}
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
              <SectionCard
                title="Study plans"
                titleAdornment={
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {planPending.length}
                  </Typography>
                }
                bodySx={{ ...sectionContentSx, py: 0.75 }}
              >
                {planPending.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    {potdPending.length > 0
                      ? "No other plans due today — focus on today's POTD above."
                      : "No study-plan items left for today."}
                  </Typography>
                ) : (
                  planPendingBySchedule.map((group, gi) => (
                    <motion.div
                      key={group.scheduleName}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gi * 0.05 }}
                    >
                      <ScheduleAssignmentGroup
                        scheduleName={group.scheduleName}
                        scheduleType={group.scheduleType}
                        assignments={group.items}
                      />
                    </motion.div>
                  ))
                )}
              </SectionCard>

              <SectionCard
                title="Overdue"
                titleAdornment={
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {due.length}
                  </Typography>
                }
                sx={{ borderLeft: "3px solid #EF4444" }}
                bodySx={{ ...sectionContentSx, py: 0.75 }}
              >
                {dueQuery.isLoading ? (
                  <LoadingSkeleton variant="list" count={3} />
                ) : due.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    No overdue problems.
                  </Typography>
                ) : (
                  dueBySchedule.map((group) => (
                    <ScheduleAssignmentGroup
                      key={`due-${group.scheduleName}`}
                      scheduleName={group.scheduleName}
                      scheduleType={group.scheduleType}
                      assignments={group.items}
                      variant="overdue"
                    />
                  ))
                )}
              </SectionCard>
            </Box>
          </>
        )}
      </ScrollRegion>
    </FixedPageShell>
  );
}
