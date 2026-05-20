import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { validatePassword } from "@/utils/passwordPolicy";
import { miui } from "@/theme/theme";

const LABELS = ["Weak", "Fair", "Good", "Strong", "Excellent"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const { valid, errors, score } = validatePassword(password);
  const pct = Math.min(100, (score / 5) * 100);
  const label = LABELS[Math.min(score, LABELS.length - 1)] ?? "Weak";

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" sx={{ mb: 0.5, justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: miui.textMuted }}>
          Password strength
        </Typography>
        <Typography variant="caption" sx={{ color: valid ? miui.accent : miui.textDim, fontWeight: 600 }}>
          {label}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: miui.border,
          "& .MuiLinearProgress-bar": {
            bgcolor: valid ? miui.accent : "#c45c4a",
          },
        }}
      />
      {errors.length > 0 && (
        <Stack component="ul" sx={{ m: "8px 0 0", pl: 2.5, color: miui.textDim }}>
          {errors.map((e) => (
            <Typography key={e} component="li" variant="caption">
              {e}
            </Typography>
          ))}
        </Stack>
      )}
    </Box>
  );
}
