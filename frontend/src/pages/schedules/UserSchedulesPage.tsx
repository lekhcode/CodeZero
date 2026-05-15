import {
  Alert,
  Box,
  Chip,
  IconButton,
  Stack,
  Switch,
  Typography,
  alpha,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys } from "@/hooks/queryKeys";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { glassSx } from "@/theme/theme";

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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: schedulesService.deleteUserSchedule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userSchedules });
      void queryClient.invalidateQueries({ queryKey: queryKeys.todayAssignments });
    },
  });

  return (
    <PageContainer>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            My schedules
          </Typography>
          <Typography color="text.secondary">Toggle, remove, or add learning streams</Typography>
        </Box>
        <Button component={RouterLink} to="/templates" variant="contained">
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
              ...glassSx,
              borderRadius: 2,
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              opacity: schedule.active ? 1 : 0.75,
              bgcolor: schedule.active ? alpha("#fff", 0.85) : alpha("#f1f5f9", 0.9),
            }}
          >
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ fontWeight: 700 }}>{schedule.template.name}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                <Chip label={schedule.template.type.replace("_", " ")} size="small" />
                {schedule.dailyQuestions != null && (
                  <Chip label={`${schedule.dailyQuestions}/day`} size="small" variant="outlined" />
                )}
                {schedule.difficulty && (
                  <Chip label={schedule.difficulty} size="small" variant="outlined" />
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Switch
                checked={schedule.active}
                onChange={() => toggleMutation.mutate(schedule.id)}
                disabled={toggleMutation.isPending}
              />
              <IconButton
                color="error"
                onClick={() => {
                  if (window.confirm(`Remove ${schedule.template.name}?`)) {
                    deleteMutation.mutate(schedule.id);
                  }
                }}
                aria-label="Delete schedule"
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
