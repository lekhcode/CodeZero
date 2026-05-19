import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys, trackedDuePrefix, trackedTodayPrefix } from "@/hooks/queryKeys";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { miui } from "@/theme/theme";

const metaBadgeSx = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: "11px",
  fontWeight: 400,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  bgcolor: miui.elevated,
  border: `1px solid ${miui.border}`,
  color: miui.textMuted,
  borderRadius: "4px",
  px: 1,
  py: 0.25,
  lineHeight: 1.4,
};

export function UserSchedulesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.userSchedules,
    queryFn: schedulesService.listUserSchedules,
  });

  const toggleMutation = useMutation({
    mutationFn: schedulesService.toggleUserSchedule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userSchedules });
      void queryClient.invalidateQueries({ queryKey: queryKeys.todayAssignments });
      void queryClient.invalidateQueries({ queryKey: trackedTodayPrefix });
      void queryClient.invalidateQueries({ queryKey: trackedDuePrefix });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: schedulesService.deleteUserSchedule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userSchedules });
      void queryClient.invalidateQueries({ queryKey: queryKeys.todayAssignments });
      void queryClient.invalidateQueries({ queryKey: trackedTodayPrefix });
      void queryClient.invalidateQueries({ queryKey: trackedDuePrefix });
    },
  });

  return (
    <PageContainer sx={{ bgcolor: miui.bg, maxWidth: 900 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography
            variant="h4"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: "28px", color: miui.text }}
          >
            My schedules
          </Typography>
          <Typography sx={{ color: miui.textMuted, fontWeight: 400, fontSize: "14px" }}>
            Toggle, remove, or add learning streams
          </Typography>
        </Box>
        <Button component={RouterLink} to="/templates" variant="contained" sx={{ fontWeight: 500 }}>
          Add schedule
        </Button>
      </Box>

      {isLoading && <LoadingSkeleton variant="list" count={4} />}
      {isError && <Alert severity="error">{(error as Error).message}</Alert>}

      {data?.length === 0 && (
        <EmptyState
          title="No schedules yet"
          description="Explore templates and enroll in POTD, Blind 75, or Top Interview 150."
          actionLabel="Browse templates"
          onAction={() => navigate("/templates")}
        />
      )}

      <Stack spacing={1.5}>
        {data?.map((schedule) => (
          <Box
            key={schedule.id}
            sx={{
              borderRadius: "12px",
              p: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              opacity: schedule.active ? 1 : 0.75,
              bgcolor: miui.paper,
              border: `1px solid ${miui.border}`,
              transition: "border-color 150ms ease",
              "&:hover": { borderColor: miui.borderStrong },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 600,
                  fontSize: "15px",
                  color: miui.text,
                }}
              >
                {schedule.template.name}
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                <Box component="span" sx={metaBadgeSx}>
                  {schedule.template.type.replace("_", " ")}
                </Box>
                {schedule.dailyQuestions != null && (
                  <Box component="span" sx={{ ...metaBadgeSx, color: miui.primary }}>
                    {schedule.dailyQuestions}/day
                  </Box>
                )}
                {schedule.difficulty && (
                  <Box component="span" sx={metaBadgeSx}>
                    {schedule.difficulty}
                  </Box>
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: miui.textMuted, fontWeight: 400, fontSize: "13px" }}>
                Active
              </Typography>
              <Switch
                checked={schedule.active}
                onChange={() => toggleMutation.mutate(schedule.id)}
                disabled={toggleMutation.isPending}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: miui.primary,
                    "& + .MuiSwitch-track": { bgcolor: miui.primary, opacity: 0.45 },
                  },
                  "& .MuiSwitch-track": { bgcolor: miui.elevated, opacity: 1 },
                }}
              />
              <IconButton
                onClick={() => {
                  if (window.confirm(`Remove ${schedule.template.name}?`)) {
                    deleteMutation.mutate(schedule.id);
                  }
                }}
                aria-label="Delete schedule"
                sx={{
                  color: miui.textMuted,
                  transition: "color 150ms ease",
                  "&:hover": { color: miui.danger, bgcolor: "transparent" },
                }}
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>
    </PageContainer>
  );
}
