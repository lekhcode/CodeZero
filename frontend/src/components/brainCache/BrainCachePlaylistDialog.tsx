import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  name: string;
  revisionIntervalDays: number;
};

type BrainCachePlaylistDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  loading?: boolean;
};

export function BrainCachePlaylistDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
}: BrainCachePlaylistDialogProps) {
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { name: "", revisionIntervalDays: 7 },
  });

  useEffect(() => {
    if (open) reset({ name: "", revisionIntervalDays: 7 });
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={{ fontWeight: 800 }}>New Brain Cache playlist</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Playlist name"
              placeholder="e.g. DP Revision, Google Prep"
              fullWidth
              autoFocus
              {...register("name", { required: true, minLength: 1 })}
              error={Boolean(formState.errors.name)}
            />
            <TextField
              label="Revise every (days)"
              type="number"
              fullWidth
              {...register("revisionIntervalDays", { required: true, min: 1, max: 365, valueAsNumber: true })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
