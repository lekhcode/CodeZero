import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { tokenStorage } from "@/utils/storage";

export function GitHubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [message, setMessage] = useState("connecting your account...");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const token = searchParams.get("token");
      if (token) {
        try {
          tokenStorage.set(token);
          const user = await authService.me();
          if (!cancelled) {
            setSession(user, token);
            navigate("/community", { replace: true });
          }
        } catch {
          if (!cancelled) {
            setMessage("GitHub sign-in failed. Redirecting…");
            navigate("/login?error=github_session", { replace: true });
          }
        }
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        try {
          const data = await authService.githubExchange(code);
          if (!cancelled) {
            setSession(data.user, data.accessToken);
            navigate("/community", { replace: true });
          }
        } catch {
          if (!cancelled) {
            setMessage("GitHub sign-in failed. Redirecting…");
            navigate("/login?error=github_auth", { replace: true });
          }
        }
        return;
      }

      if (!cancelled) {
        navigate("/login?error=github_missing", { replace: true });
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setSession]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg-base)",
        fontFamily: "'Fira Code', monospace",
        color: "var(--text-2)",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}
