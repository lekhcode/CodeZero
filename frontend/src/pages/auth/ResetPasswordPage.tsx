import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { authService } from "@/services/auth.service";
import { validatePassword } from "@/utils/passwordPolicy";
import { miui } from "@/theme/theme";
import { ApiRequestError } from "@/services/api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pv = validatePassword(password);
    if (!pv.valid) {
      setError("Password does not meet requirements");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await authService.resetPassword(email, code, password);
      setMessage(r.message);
      window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={(e) => void submit(e)}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Reset password
      </Typography>
      <Typography variant="body2" sx={{ color: miui.textMuted, mb: 3 }}>
        Enter the code sent to {email}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Stack spacing={2.5} sx={{ alignItems: "center" }}>
        <OtpInput value={code} onChange={setCode} disabled={loading} />
        <TextField
          label="New password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength password={password} />
        <TextField
          label="Confirm password"
          type="password"
          fullWidth
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
        <Typography variant="body2">
          <RouterLink to="/login" style={{ color: miui.accent, fontWeight: 700 }}>
            Sign in
          </RouterLink>
        </Typography>
      </Stack>
    </Box>
  );
}
