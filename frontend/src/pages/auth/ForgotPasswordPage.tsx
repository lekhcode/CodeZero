import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { miui } from "@/theme/theme";
import { ApiRequestError } from "@/services/api";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={(e) => void submit(e)}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Forgot password
      </Typography>
      <Typography variant="body2" sx={{ color: miui.textMuted, mb: 3 }}>
        We will email you a reset code
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading ? "Sending…" : "Send reset code"}
        </Button>
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          <RouterLink to="/login" style={{ color: miui.accent, fontWeight: 700 }}>
            Back to sign in
          </RouterLink>
        </Typography>
      </Stack>
    </Box>
  );
}
