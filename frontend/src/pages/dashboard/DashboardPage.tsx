import type { ReactNode } from "react";
import { Alert, Box, Button, Grid, LinearProgress, Stack, Typography, alpha } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { CompactAssignmentRow } from "@/components/learning/CompactAssignmentRow";
import { SubmissionHistoryRow } from "@/components/learning/SubmissionHistoryRow";
import { SolveProgressRing } from "@/components/learning/SolveProgressRing";
import { LearningTrendChart } from "@/components/learning/LearningTrendChart";
import { learningService } from "@/services/learning.service";
import { insightsService } from "@/services/insights.service";
import { submissionsService } from "@/services/submissions.service";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys } from "@/hooks/queryKeys";
import { useAuthStore } from "@/store/authStore";
import { labAccentGradient, miui, miuiCardSx, sectionContentSx } from "@/theme/theme";
import dayjs from "dayjs";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function LiveStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Box
        sx={{
          ...miuiCardSx,
          p: 1.5,
          borderRadius: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          height: "100%",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(accent, 0.12),
            color: accent,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1, color: accent }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const todayLabel = dayjs().format("dddd, MMM D");

  const todayQuery = useQuery({
    queryKey: queryKeys.trackedToday,
    queryFn: learningService.getTodayAssignments,
  });

  const dueQuery = useQuery({
    queryKey: queryKeys.trackedDue,
    queryFn: learningService.getDueAssignments,
  });

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions({ page: 1, limit: 5 }),
    queryFn: () => submissionsService.list({ page: 1, limit: 5 }),
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.userSchedules,
    queryFn: schedulesService.listUserSchedules,
  });

  const insightsQuery = useQuery({
    queryKey: queryKeys.learningInsights,
    queryFn: insightsService.getLearningInsights,
  });

  const stats = todayQuery.data?.stats;
  const pendingToday = todayQuery.data?.assignments.filter((a) => a.status === "PENDING") ?? [];
  const solvedToday = todayQuery.data?.assignments.filter((a) => a.status === "SOLVED") ?? [];
  const dueAssignments = dueQuery.data?.assignments ?? [];
  const recentSubmissions = submissionsQuery.data?.submissions ?? [];
  const activeCount = schedulesQuery.data?.filter((s) => s.active).length ?? 0;

  const totalToday = pendingToday.length + solvedToday.length;
  const progressPct = totalToday > 0 ? Math.round((solvedToday.length / totalToday) * 100) : 0;
  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <PageContainer sx={{ maxWidth: "100%" }}>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 3,
              background: `linear-gradient(120deg, ${alpha(miui.primary, 0.12)} 0%, ${alpha(miui.accent, 0.06)} 40%, ${miui.paper} 100%)`,
              border: `1px solid ${miui.border}`,
              position: "relative",
              overflow: "clip",
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -30,
                top: -30,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: labAccentGradient,
                opacity: 0.15,
                filter: "blur(32px)",
              }}
            />
            <Grid container spacing={2} sx={{ position: "relative", zIndex: 1 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700 }}>
                  {todayLabel}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mt: 0.25 }}>
                  Hi {firstName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 480 }}>
                  {progressPct}% of today&apos;s queue done
                  {dueAssignments.length > 0 && ` · ${dueAssignments.length} overdue`}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{
                    mt: 1.5,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(miui.primary, 0.1),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 3,
                      background: labAccentGradient,
                    },
                  }}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                  <Button
                    component={RouterLink}
                    to="/today"
                    variant="contained"
                    size="small"
                    startIcon={<TodayRoundedIcon />}
                  >
                    Today
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/submissions"
                    variant="outlined"
                    size="small"
                    startIcon={<HistoryRoundedIcon />}
                  >
                    Submissions
                  </Button>
                </Stack>
              </Grid>
              {stats && (
                <Grid
                  size={{ xs: 12, md: 4 }}
                  sx={{ display: "flex", justifyContent: { md: "flex-end" }, alignItems: "center" }}
                >
                  <SolveProgressRing
                    solved={stats.totalSolved}
                    total={stats.totalProblemsInCatalog}
                    size={96}
                    label="Catalog"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </motion.div>

        <Box sx={{ mb: 2 }}>
          {insightsQuery.isLoading ? (
            <LoadingSkeleton variant="detail" />
          ) : insightsQuery.isError ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Could not load momentum chart. Restart backend and refresh.
            </Alert>
          ) : insightsQuery.data ? (
            <LearningTrendChart insights={insightsQuery.data} />
          ) : null}
        </Box>

        {todayQuery.isLoading ? (
          <LoadingSkeleton variant="detail" />
        ) : (
          <>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat
                  label="Solved today"
                  value={stats?.solvedToday ?? 0}
                  icon={<AssignmentTurnedInRoundedIcon fontSize="small" />}
                  accent="#22C55E"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat
                  label="Pending"
                  value={stats?.pendingToday ?? 0}
                  icon={<PendingActionsRoundedIcon fontSize="small" />}
                  accent={miui.accent}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat
                  label="Overdue"
                  value={stats?.dueCount ?? 0}
                  icon={<WarningAmberRoundedIcon fontSize="small" />}
                  accent="#EF4444"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat
                  label="Accepted"
                  value={stats?.totalAccepted ?? 0}
                  icon={<CodeRoundedIcon fontSize="small" />}
                  accent={miui.primary}
                />
              </Grid>
            </Grid>

            {(todayQuery.isError || dueQuery.isError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {todayQuery.error?.message ?? dueQuery.error?.message}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <motion.div variants={fadeUp}>
                  <Panel title="Pending today" actionLabel="Open" actionTo="/today" count={pendingToday.length}>
                    {pendingToday.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ...sectionContentSx, py: 2 }}>
                        No pending — you&apos;re clear for today.
                      </Typography>
                    ) : (
                      pendingToday.slice(0, 5).map((a, i) => (
                        <CompactAssignmentRow
                          key={a.id}
                          assignment={a}
                          isLast={i === Math.min(pendingToday.length, 5) - 1}
                        />
                      ))
                    )}
                  </Panel>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Panel
                    title="Overdue"
                    actionLabel="Resume"
                    actionTo="/today"
                    count={dueAssignments.length}
                    sx={{ mt: 2 }}
                  >
                    {dueAssignments.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ...sectionContentSx, py: 2 }}>
                        All caught up.
                      </Typography>
                    ) : (
                      dueAssignments.slice(0, 4).map((a, i) => (
                        <CompactAssignmentRow
                          key={a.id}
                          assignment={a}
                          isLast={i === Math.min(dueAssignments.length, 4) - 1}
                        />
                      ))
                    )}
                  </Panel>
                </motion.div>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <motion.div variants={fadeUp}>
                  <Panel
                    title="Recent submissions"
                    actionLabel="All"
                    actionTo="/submissions"
                  >
                    {submissionsQuery.isLoading ? (
                      <LoadingSkeleton variant="list" count={4} />
                    ) : recentSubmissions.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ...sectionContentSx, py: 2 }}>
                        No runs yet.
                      </Typography>
                    ) : (
                      recentSubmissions.map((s, i) => (
                        <SubmissionHistoryRow
                          key={s.id}
                          submission={s}
                          isLast={i === recentSubmissions.length - 1}
                        />
                      ))
                    )}
                  </Panel>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Box sx={{ ...miuiCardSx, ...sectionContentSx, mt: 2, borderRadius: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Schedules
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {activeCount} active paths enrolled
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/templates"
                      size="small"
                      variant="outlined"
                      startIcon={<ExploreRoundedIcon />}
                    >
                      Explore
                    </Button>
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </>
        )}
      </motion.div>
    </PageContainer>
  );
}

function Panel({
  title,
  actionLabel,
  actionTo,
  count,
  children,
  sx,
}: {
  title: string;
  actionLabel: string;
  actionTo: string;
  count?: number;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <SectionCard
      sx={{ borderRadius: 2.5, ...sx }}
      title={title}
      titleAdornment={
        count !== undefined ? (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {count}
          </Typography>
        ) : undefined
      }
      action={
        <Button
          component={RouterLink}
          to={actionTo}
          size="small"
          sx={{ minWidth: 0, fontSize: "0.75rem", flexShrink: 0 }}
        >
          {actionLabel}
        </Button>
      }
    >
      {children}
    </SectionCard>
  );
}
