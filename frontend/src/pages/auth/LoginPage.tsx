import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID ?? "";
const GITHUB_REDIRECT_URI =
  import.meta.env.VITE_GITHUB_REDIRECT_URI ?? `${window.location.origin}/auth/github/callback`;

const SNIPPETS = [
  "O(log n)",
  "BFS(G,s)",
  "dp[i][j]",
  "two_sum()",
  "merge()",
  "O(n²)",
  "dfs(node)",
  "cache[k]",
  "left>>1",
  "arr.sort()",
  "stack.pop()",
  "memo={}",
  "n*(n-1)/2",
  "TreeNode",
  "ListNode",
  "hashmap",
  "binary_search",
  "backtrack()",
  "O(1) space",
  "LRU",
  "Dijkstra",
  "topSort()",
  "union-find",
  "sliding_window",
  "0/1 knapsack",
];

const PARTICLE_COLORS = ["#9B7FEA", "#4ADE80", "#F6C360", "#FC8181", "#7D7A8E"];

const OAUTH_ERRORS: Record<string, string> = {
  github_auth: "GitHub sign-in failed. Try again.",
  github_session: "Could not load your profile after GitHub sign-in.",
  github_missing: "GitHub did not return an authorization code.",
};

export function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "placeholder.apps.googleusercontent.com"}>
      <LoginPageInner />
    </GoogleOAuthProvider>
  );
}

function LoginPageInner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    const oauthErr = searchParams.get("error");
    if (oauthErr && OAUTH_ERRORS[oauthErr]) {
      setError(OAUTH_ERRORS[oauthErr] ?? "Sign-in failed.");
    }
  }, [searchParams]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      text: string;
      color: string;
      alpha: number;
      size: number;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];

    const spawn = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.6 + 0.2),
        text: SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)] ?? "dp[]",
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)] ?? "#9B7FEA",
        alpha: 0,
        size: Math.random() * 2 + 10,
        life: 0,
        maxLife: Math.random() * 300 + 200,
      });
    };

    let frame = 0;
    let animId = 0;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frame % 40 === 0 && particles.length < 15) spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const progress = p.life / p.maxLife;
        p.alpha =
          progress < 0.15 ? progress / 0.15 : progress > 0.75 ? 1 - (progress - 0.75) / 0.25 : 1;

        ctx.save();
        ctx.globalAlpha = p.alpha * 0.55;
        ctx.font = `${p.size}px 'Fira Code', monospace`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      frame++;
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: { credential?: string }) => {
      const credential = credentialResponse.credential;
      if (!credential) {
        setError("Google sign-in failed. Try again.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await authService.googleAuth(credential);
        setSession(data.user, data.accessToken);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [navigate, setSession],
  );

  const githubLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      setError("GitHub sign-in is not configured.");
      return;
    }
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: "user:email",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  const oauthIcons = (
    <div className="oauth-icon-row oauth-icon-row--below" aria-label="Social sign-in">
      <div className="oauth-icon-slot" title="Continue with Google">
        {GOOGLE_CLIENT_ID ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in cancelled.")}
            type="icon"
            shape="circle"
            size="large"
            theme="filled_black"
          />
        ) : (
          <button type="button" className="oauth-icon-btn" disabled title="Google OAuth not configured">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </button>
        )}
      </div>
      <button
        type="button"
        className="oauth-icon-btn"
        onClick={githubLogin}
        disabled={loading || !GITHUB_CLIENT_ID}
        title="Continue with GitHub"
        aria-label="Continue with GitHub"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#EDE9F6" aria-hidden>
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      </button>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await authService.register(email, password);
      }
      const data = await authService.login(email, password);
      setSession(data.user, data.accessToken);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        display: "grid",
        gridTemplateColumns: "1fr 480px",
        height: "100vh",
        background: "#0C0B10",
        fontFamily: "'Syne', sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        className="login-left-panel"
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(#1E1C28 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 65% 55% at 35% 45%, rgba(155,127,234,0.07) 0%, transparent 70%)",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          aria-hidden
        />
        <div style={{ position: "relative", zIndex: 2 }}>
          <p
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 11,
              color: "#44414F",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            your personal coding gym
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 800,
              color: "#EDE9F6",
              lineHeight: 1.08,
              marginBottom: 18,
              letterSpacing: "-0.02em",
            }}
          >
            Train harder.
            <br />
            <span style={{ color: "#9B7FEA" }}>Think sharper.</span>
          </h1>
          <p
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 13,
              color: "#7D7A8E",
              lineHeight: 1.7,
              maxWidth: 380,
              marginBottom: 48,
            }}
          >
            DSA practice with spaced revision, streak tracking, and a Brain Cache that never lets
            important problems slip.
          </p>
          <div style={{ display: "flex", gap: 40 }}>
            {[
              { num: "3,167", label: "problems", color: "#EDE9F6" },
              { num: "847", label: "active users", color: "#4ADE80" },
              { num: "98%", label: "retention", color: "#E8834A" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 22,
                    fontWeight: 500,
                    color: s.color,
                    marginBottom: 2,
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: 10,
                    color: "#44414F",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="login-right-panel"
        style={{
          background: "#13111A",
          borderLeft: "1px solid #1E1C28",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 44px",
          position: "relative",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: 18,
            color: "#EDE9F6",
            letterSpacing: "-0.5px",
            marginBottom: 36,
          }}
        >
          c&lt;&gt;de<span style={{ color: "#9B7FEA" }}>{"{0}"}</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#EDE9F6", marginBottom: 4 }}>
          {mode === "signin" ? "Welcome back" : "Join the dojo"}
        </h2>
        <p
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: 12,
            color: "#7D7A8E",
            marginBottom: 28,
          }}
        >
          {mode === "signin" ? "continue your training session_" : "start your revision journey_"}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px" }}>
          <div style={{ flex: 1, height: 1, background: "#1E1C28" }} />
          <span
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: 11,
              color: "#44414F",
              letterSpacing: "0.08em",
            }}
          >
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: "#1E1C28" }} />
        </div>

        <form onSubmit={handleSubmit}>
          {[
            {
              label: "Email",
              type: "email",
              value: email,
              placeholder: "you@example.com",
              onChange: setEmail,
            },
            {
              label: "Password",
              type: "password",
              value: password,
              placeholder: "••••••••",
              onChange: setPassword,
            },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 10,
                  color: "#7D7A8E",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                autoComplete={field.type === "email" ? "email" : "current-password"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#141220",
                  border: "1px solid #1E1C28",
                  borderRadius: 8,
                  color: "#EDE9F6",
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 13,
                  outline: "none",
                  transition: "border-color 180ms",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#9B7FEA";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#1E1C28";
                }}
              />
            </div>
          ))}

          {mode === "signin" && (
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <Link
                to="/register"
                style={{
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 11,
                  color: "#9B7FEA",
                  textDecoration: "none",
                }}
              >
                forgot password?
              </Link>
            </div>
          )}

          {error && (
            <div
              style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 12,
                color: "#FC8181",
                background: "rgba(252,129,129,0.08)",
                border: "1px solid rgba(252,129,129,0.18)",
                borderRadius: 6,
                padding: "8px 12px",
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
          >
            <span className="login-submit-btn__label">
              {loading ? "connecting..." : mode === "signin" ? "Sign in →" : "Create account →"}
            </span>
          </button>
        </form>

        <p className="oauth-below-label">or continue with</p>
        {oauthIcons}

        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontFamily: "'Fira Code', monospace",
            fontSize: 12,
            color: "#7D7A8E",
          }}
        >
          {mode === "signin" ? "New here? " : "Have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#9B7FEA",
              cursor: "pointer",
              fontFamily: "'Fira Code', monospace",
              fontSize: 12,
              padding: 0,
            }}
          >
            {mode === "signin" ? "create account" : "sign in"}
          </button>
        </p>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, #9B7FEA, #E8834A, transparent)",
          }}
        />
      </div>
    </div>
  );
}
