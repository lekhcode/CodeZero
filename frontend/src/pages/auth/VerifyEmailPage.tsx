import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { OtpInput } from "@/components/auth/OtpInput";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { miui } from "@/theme/theme";
import { ApiRequestError } from "@/services/api";

const RESEND_SEC = 60;

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_SEC);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const submit = async () => {
    if (!email || code.length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await authService.verifyEmail(email, code);
      setSession(result.user, result.accessToken);
      navigate("/community", { replace: true });
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setResendLoading(true);
    setError("");
    try {
      const r = await authService.resendOtp(email);
      setMessage(r.message);
      setCooldown(RESEND_SEC);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Could not resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Verify your email
      </Typography>
      <Typography variant="body2" sx={{ color: miui.textMuted, mb: 3 }}>
        We sent a 6-digit code to <strong style={{ color: miui.text }}>{email || "your email"}</strong>
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <OtpInput value={code} onChange={setCode} disabled={loading} />
        <Button variant="contained" fullWidth size="large" disabled={loading} onClick={() => void submit()}>
          {loading ? "Verifying…" : "Activate account"}
        </Button>
        <Button
          variant="text"
          disabled={resendLoading || cooldown > 0}
          onClick={() => void resend()}
          sx={{ color: miui.textMuted }}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : resendLoading ? "Sending…" : "Resend code"}
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
