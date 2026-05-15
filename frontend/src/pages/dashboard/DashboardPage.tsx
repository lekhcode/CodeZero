import type { ReactNode } from "react";
import { Alert, Box, Button, Grid, Stack, Typography, alpha } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatsCard } from "@/components/cards/StatsCard";
import { AssignmentCard } from "@/components/cards/AssignmentCard";
import { DailyPotdHero } from "@/components/cards/DailyPotdHero";
import { assignmentsService } from "@/services/assignments.service";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys } from "@/hooks/queryKeys";
import { useAuthStore } from "@/store/authStore";
import type { TodayAssignment } from "@/types/api.types";
import { glassSx } from "@/theme/theme";
import dayjs from "dayjs";

function groupAssignments(assignments: TodayAssignment[]) {
  const potd: Array<{ assignment: TodayAssignment; problem: TodayAssignment["problems"][0] }> = [];
  const study: typeof potd = [];
  const topic: typeof potd = [];

  for (const a of assignments) {
    const bucket =
      a.scheduleType === "DAILY_POTD" ? potd : a.scheduleType === "STUDY_PLAN" ? study : topic;
    if (a.problems.length === 0) {
      bucket.push({ assignment: a, problem: null as never });
    } else {
      for (const problem of a.problems) {
        bucket.push({ assignment: a, problem });
      }
    }
  }
  return { potd, study, topic };
}

function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ ...glassSx, borderRadius: 4, p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{
          mb: subtitle ? 2 : 1.5,
          justifyContent: "space-between",
          alignItems: { sm: "center" },
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const today = dayjs().format("dddd, MMMM D");

  const assignmentsQuery = useQuery({
    queryKey: queryKeys.todayAssignments,
    queryFn: assignmentsService.getToday,
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.userSchedules,
    queryFn: schedulesService.listUserSchedules,
  });

  const assignments = assignmentsQuery.data?.assignments ?? [];
  const activeCount = schedulesQuery.data?.filter((s) => s.active).length ?? 0;
  const readyProblems = assignments.reduce((n, a) => n + (a.status === "ready" ? a.problems.length : 0), 0);
  const grouped = groupAssignments(assignments);

  const potdAssignment = assignments.find((a) => a.scheduleType === "DAILY_POTD");
  const potdProblem = grouped.potd.find((p) => p.problem)?.problem ?? null;
  const potdEnrolled =
    schedulesQuery.data?.some((s) => s.template.slug === "daily-potd" && s.active) ?? false;

  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <PageContainer>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.1em" }}
        >
          {today}
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
        >
          Good to see you, {firstName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
          Here&apos;s everything on your plate today — start with POTD, then knock out your study plan.
        </Typography>
      </Box>

      {assignmentsQuery.isLoading ? (
        <LoadingSkeleton variant="detail" />
      ) : (
        <DailyPotdHero
          problem={potdProblem}
          status={potdAssignment?.status ?? (potdEnrolled ? "unavailable" : "pending")}
          challengeDate={potdAssignment?.challengeDate}
          enrolled={potdEnrolled || Boolean(potdAssignment)}
        />
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatsCard
            label="Ready today"
            value={readyProblems}
            hint="Problems queued"
            icon={<AssignmentTurnedInRoundedIcon />}
            accent="#4f46e5"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatsCard
            label="Active schedules"
            value={activeCount}
            hint="Max 5"
            icon={<ScheduleRoundedIcon />}
            accent="#0ea5e9"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatsCard
            label="Study streak"
            value="—"
            hint="Coming soon"
            icon={<LocalFireDepartmentRoundedIcon />}
            accent="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatsCard
            label="Revisions"
            value="—"
            hint="Spaced review"
            icon={<MenuBookRoundedIcon />}
            accent="#059669"
          />
        </Grid>
      </Grid>

      {activeCount === 0 && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 3,
            bgcolor: alpha("#4f46e5", 0.06),
            border: `1px dashed ${alpha("#4f46e5", 0.3)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            You don&apos;t have any schedules yet. Pick Daily POTD + a study plan to get started.
          </Typography>
          <Button
            component={RouterLink}
            to="/templates"
            variant="contained"
            startIcon={<ExploreRoundedIcon />}
            size="small"
          >
            Explore schedules
          </Button>
        </Box>
      )}

      {assignmentsQuery.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {assignmentsQuery.error.message}
        </Alert>
      )}

      {!assignmentsQuery.isLoading && (
        <>
          <Section
            title="Study plans for today"
            subtitle="Problems picked in order from Blind 75, Top Interview 150, and other enrolled plans."
            action={
              <Button component={RouterLink} to="/templates" size="small">
                Add plan
              </Button>
            }
          >
            {grouped.study.length === 0 ? (
              <EmptyState
                title="No study plans yet"
                description="Blind 75 and Top Interview 150 assign the next problems in the list each day you practice."
                actionLabel="Browse study plans"
                onAction={() => navigate("/templates")}
              />
            ) : (
              <Grid container spacing={2}>
                {grouped.study.map(({ assignment, problem }, i) =>
                  problem ? (
                    <Grid key={`${assignment.userScheduleId}-${problem.slug}-${i}`} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <AssignmentCard
                        problem={problem}
                        templateName={assignment.templateName}
                        status={assignment.status}
                        index={i}
                      />
                    </Grid>
                  ) : null,
                )}
                {grouped.study.every((x) => !x.problem) && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Your study plans are active — today&apos;s slot may be complete or still syncing.
                      {grouped.study[0]?.assignment.planProgress && (
                        <>
                          {" "}
                          Day {grouped.study[0].assignment.planProgress.dayIndex + 1} on track.
                        </>
                      )}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </Section>

          <Section
            title="Topic practice"
            subtitle="Focused drills by pattern — full assignment pools arriving soon."
          >
            {grouped.topic.length === 0 ? (
              <EmptyState
                title="No topic tracks"
                description="Try Binary Search, Graphs, or Dynamic Programming from Explore."
                actionLabel="Explore topics"
                onAction={() => navigate("/templates")}
              />
            ) : (
              <Alert severity="info" sx={{ borderRadius: 2, bgcolor: alpha("#0ea5e9", 0.06) }}>
                Topic schedules are enrolled — problem pools will appear here in a future update.
              </Alert>
            )}
          </Section>
        </>
      )}
    </PageContainer>
  );
}
