import type { ReactNode } from "react";
import { Alert, Box, Button, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { CompactAssignmentRow } from "@/components/learning/CompactAssignmentRow";
import { BrainCacheCompactRevisionRow } from "@/components/brainCache/BrainCacheCompactRevisionRow";
import { SubmissionHistoryRow } from "@/components/learning/SubmissionHistoryRow";
import { SolveProgressRing } from "@/components/learning/SolveProgressRing";
import { LearningTrendChart } from "@/components/learning/LearningTrendChart";
import { learningService } from "@/services/learning.service";
import { insightsService } from "@/services/insights.service";
import { submissionsService } from "@/services/submissions.service";
import { schedulesService } from "@/services/schedules.service";
import { brainCacheService } from "@/services/brainCache.service";
import { queryKeys } from "@/hooks/queryKeys";
import { ProblemCatalogInfiniteList } from "@/components/problems/ProblemCatalogInfiniteList";
import { useAuthStore } from "@/store/authStore";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { WeekBelt } from "@/components/dashboard/WeekBelt";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { FadeInCard } from "@/components/ui/FadeInCard";
import { dashNavTabSx, miui, miuiCardSx, monoStatSx, sectionContentSx } from "@/theme/theme";
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
  accent,
  pulse,
  valueTo,
  delay = 0,
}: {
  label: string;
  value: number;
  accent: string;
  pulse?: boolean;
  valueTo?: string;
  delay?: number;
}) {
  const valueNode = (
    <Typography
      component={valueTo !== undefined ? RouterLink : "span"}
      to={valueTo}
      sx={{
        ...monoStatSx,
        fontSize: "2rem",
        fontWeight: 700,
        lineHeight: 1,
        color: accent,
        textDecoration: "none",
        display: "inline-block",
        ...(valueTo !== undefined
          ? {
              cursor: "pointer",
              "&:hover": { filter: "brightness(1.1)" },
            }
          : {}),
      }}
    >
      <AnimatedNumber value={value} />
    </Typography>
  );

  return (
    <FadeInCard delay={delay} className="card miui-card" borderRadius={3}>
      <Box
        className={pulse && value > 0 ? "overdue-active" : undefined}
        sx={{
          ...miuiCardSx,
          p: 2,
          borderRadius: 3,
          height: "100%",
          minWidth: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Typography variant="caption" sx={{ display: "block", mb: 0.75 }}>
          {label}
        </Typography>
        {valueNode}
      </Box>
    </FadeInCard>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const todayLabel = dayjs().format("dddd, MMM D");

  const todayQuery = useQuery({
    queryKey: queryKeys.trackedToday(),
    queryFn: learningService.getTodayAssignments,
  });

  const dueQuery = useQuery({
    queryKey: queryKeys.trackedDue(),
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

  const brainTodayQuery = useQuery({
    queryKey: queryKeys.brainCacheToday(),
    queryFn: brainCacheService.todayRevisions,
  });

  const brainOverdueQuery = useQuery({
    queryKey: queryKeys.brainCacheOverdue(),
    queryFn: brainCacheService.overdueRevisions,
  });

  const stats = todayQuery.data?.stats;
  const pendingToday = todayQuery.data?.assignments.filter((a) => a.status === "PENDING") ?? [];
  const solvedToday = todayQuery.data?.assignments.filter((a) => a.status === "SOLVED") ?? [];
  const dueAssignments = dueQuery.data?.assignments ?? [];
  const brainDueToday = brainTodayQuery.data ?? [];
  const brainOverdue = brainOverdueQuery.data ?? [];
  const recentSubmissions = submissionsQuery.data?.submissions ?? [];
  const activeCount = schedulesQuery.data?.filter((s) => s.active).length ?? 0;

  const totalToday = pendingToday.length + solvedToday.length;
  const progressPct = totalToday > 0 ? Math.round((solvedToday.length / totalToday) * 100) : 0;
  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <PageContainer sx={{ maxWidth: "100%" }}>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <AnimatedBanner
            subtle
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 3,
              bgcolor: miui.paper,
              border: `1px solid ${miui.border}`,
              borderLeft: `3px solid ${miui.accent}`,
              boxSizing: "border-box",
              boxShadow: "none",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="overline" sx={{ color: "text.disabled", display: "block" }}>
                  {todayLabel}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: "1.625rem", mt: 0.25 }}
                >
                  Hi {firstName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 480 }}>
                  {progressPct}% of today&apos;s queue done
                  {dueAssignments.length > 0 && ` · ${dueAssignments.length} overdue`}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{ mt: 1.5, height: 4, borderRadius: 2, bgcolor: miui.elevated }}
                />
                <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap", borderBottom: `1px solid ${miui.border}` }}>
                  <Button
                    component={RouterLink}
                    to="/today"
                    variant="text"
                    size="small"
                    startIcon={<TodayRoundedIcon />}
                    sx={dashNavTabSx(true)}
                  >
                    Today
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/lab"
                    variant="text"
                    size="small"
                    startIcon={<MenuBookRoundedIcon />}
                    sx={dashNavTabSx(false)}
                  >
                    Problems
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/submissions"
                    variant="text"
                    size="small"
                    startIcon={<HistoryRoundedIcon />}
                    sx={dashNavTabSx(false)}
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
          </AnimatedBanner>
        </motion.div>

        {todayQuery.isLoading ? (
          <LoadingSkeleton variant="detail" />
        ) : (
          <>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat label="Solved today" value={stats?.solvedToday ?? 0} accent={miui.success} delay={0} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat label="Pending" value={stats?.pendingToday ?? 0} accent={miui.accent} delay={0.06} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat
                  label="Overdue"
                  value={stats?.dueCount ?? 0}
                  accent={miui.danger}
                  pulse
                  valueTo="/today?tab=timeline"
                  delay={0.12}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <LiveStat label="Accepted" value={stats?.totalAccepted ?? 0} accent={miui.accent} delay={0.18} />
              </Grid>
            </Grid>

            {(todayQuery.isError || dueQuery.isError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {todayQuery.error?.message ?? dueQuery.error?.message}
              </Alert>
            )}

            <motion.div variants={fadeUp}>
              <WeekBelt />
            </motion.div>

            <motion.div variants={fadeUp}>
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
            </motion.div>

            <motion.div variants={fadeUp}>
              <Panel title="Problem library" actionLabel="Open Lab" actionTo="/lab" sx={{ mb: 2 }}>
                <ProblemCatalogInfiniteList
                  filters={{ shuffle: true }}
                  pageSize={20}
                  compact
                  maxHeight={380}
                  virtualized={false}
                  enableLoadMore={false}
                />
              </Panel>
            </motion.div>

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
                        Backlog clear. Discipline is showing.
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

                {(brainDueToday.length > 0 || brainOverdue.length > 0) && (
                  <motion.div variants={fadeUp}>
                    <Panel
                      title="Brain Cache"
                      actionLabel="Open"
                      actionTo="/brain-cache"
                      count={brainDueToday.length + brainOverdue.length}
                      sx={{ mt: 2, borderLeft: `3px solid ${miui.accent}` }}
                    >
                      {brainDueToday.slice(0, 2).map((t, i) => (
                        <BrainCacheCompactRevisionRow
                          key={t.id}
                          task={t}
                          isLast={brainDueToday.length <= 2 && brainOverdue.length === 0 && i === brainDueToday.length - 1}
                        />
                      ))}
                      {brainOverdue.slice(0, 2).map((t, i) => (
                        <BrainCacheCompactRevisionRow
                          key={t.id}
                          task={t}
                          isLast={i === Math.min(brainOverdue.length, 2) - 1}
                        />
                      ))}
                    </Panel>
                  </motion.div>
                )}
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
                        No submissions yet. First rep is the hardest.
                      </Typography>
                    ) : (
                      recentSubmissions.map((s, i) => (
                        <FadeInCard key={s.id} delay={Math.min(i * 0.04, 0.32)}>
                          <SubmissionHistoryRow
                            submission={s}
                            isLast={i === recentSubmissions.length - 1}
                          />
                        </FadeInCard>
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
