import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ScheduleTemplate } from "@/types/api.types";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys, trackedDuePrefix, trackedTodayPrefix } from "@/hooks/queryKeys";
import { DIFFICULTY_OPTIONS } from "@/utils/difficulty";

const schema = z.object({
  dailyQuestions: z.number().int().min(1).max(5).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  template: ScheduleTemplate | null;
  open: boolean;
  onClose: () => void;
};

export function CreateScheduleModal({ template, open, onClose }: Props) {
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dailyQuestions: 2, difficulty: "MIXED" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!template) throw new Error("No template");
      return schedulesService.createUserSchedule({
        templateSlug: template.slug,
        ...(template.allowsCount && values.dailyQuestions !== undefined
          ? { dailyQuestions: values.dailyQuestions }
          : {}),
        ...(template.allowsDifficulty && values.difficulty
          ? { difficulty: values.difficulty }
          : {}),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userSchedules });
      void queryClient.invalidateQueries({ queryKey: queryKeys.todayAssignments });
      void queryClient.invalidateQueries({ queryKey: trackedTodayPrefix });
      void queryClient.invalidateQueries({ queryKey: trackedDuePrefix });
      reset();
      onClose();
    },
  });

  if (!template) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Enroll in {template.name}</DialogTitle>
      <DialogContent>
        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>{mutation.error.message}</Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          {template.allowsCount && (
            <Controller
              name="dailyQuestions"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Questions per day"
                  type="number"
                  slotProps={{ htmlInput: { min: 1, max: 5 } }}
                  fullWidth
                  helperText="How many problems from this plan each day (1–5)"
                />
              )}
            />
          )}
          {template.allowsDifficulty && (
            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Difficulty focus" fullWidth>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}
          {!template.allowsCount && !template.allowsDifficulty && (
            <Alert severity="info">This schedule uses fixed defaults (e.g. 1 POTD per day).</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit((v) => mutation.mutate(v))}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Enrolling…" : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
