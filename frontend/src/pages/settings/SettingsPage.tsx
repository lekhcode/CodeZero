import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { validatePassword, isValidUsernameFormat, normalizeUsername } from "@/utils/passwordPolicy";
import { miui } from "@/theme/theme";
import { queryKeys } from "@/hooks/queryKeys";
import { ApiRequestError } from "@/services/api";
import type { PublicUser } from "@/types/api.types";
import dayjs from "dayjs";

const GENDER_OPTIONS: Array<{ value: NonNullable<PublicUser["gender"]>; label: string }> = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

/** Full name field: prefer `fullName`, fall back to legacy `name` from OAuth/DB. */
function profileFullName(user: PublicUser): string {
  const fromFull = user.fullName?.trim();
  if (fromFull) return fromFull;
  const fromName = user.name?.trim();
  return fromName ?? "";
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 0,
    bgcolor: miui.paper,
    "& fieldset": { borderColor: miui.border },
    "&:hover fieldset": { borderColor: miui.borderMid },
    "&.Mui-focused fieldset": { borderColor: miui.accent },
  },
  "& .MuiInputLabel-root": { color: miui.textDim },
} as const;

const selectSx = {
  borderRadius: 0,
  bgcolor: miui.paper,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: miui.border },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: miui.borderMid },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: miui.accent },
} as const;

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ py: 3 }}>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: miui.textDim,
          mb: 2,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState<PublicUser["gender"]>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    if (!user) return;
    setUsername(user.username ?? "");
    setFullName(profileFullName(user));
    setCountry(user.country ?? "");
    setGender(user.gender ?? null);
  }, [user]);

  const normalized = normalizeUsername(username);
  const usernameOk = isValidUsernameFormat(normalized);

  const availability = useQuery({
    queryKey: ["username-check", normalized],
    queryFn: () => usersService.checkUsername(normalized),
    enabled: Boolean(user) && usernameOk && normalized !== (user?.username ?? ""),
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      usersService.updateProfile({
        username: normalized !== user?.username ? normalized : undefined,
        fullName: fullName.trim() || null,
        country: country.trim() || null,
        gender,
      }),
    onSuccess: (data) => {
      setUser(data.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      setSaveMsg("Profile saved");
      setSaveErr("");
    },
    onError: (e: Error) => {
      setSaveErr(e.message);
      setSaveMsg("");
    },
  });

  if (!user) return null;

  const usernameTaken =
    usernameOk &&
    normalized !== user.username &&
    availability.data !== undefined &&
    !availability.data.available;

  const displayName = profileFullName(user);

  return (
    <Stack spacing={0} divider={<Divider sx={{ borderColor: miui.border }} />}>
      <SettingsSection title="Account">
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "0.875rem", color: miui.text }}>{user.email}</Typography>
            {user.isEmailVerified ? (
              <Chip
                label="Verified"
                size="small"
                sx={{ height: 22, bgcolor: miui.successSoft, color: miui.success, borderRadius: 0 }}
              />
            ) : (
              <Chip label="Unverified" size="small" color="warning" sx={{ height: 22, borderRadius: 0 }} />
            )}
          </Stack>
          <Typography sx={{ fontSize: "0.75rem", color: miui.textDim }}>
            Joined {dayjs(user.createdAt).format("MMMM D, YYYY")}
          </Typography>
          {displayName && (
            <Typography sx={{ fontSize: "0.8125rem", color: miui.textMuted }}>
              Displaying as <strong style={{ color: miui.text }}>{displayName}</strong>
              {!user.fullName && user.name ? " (from profile name)" : ""}
            </Typography>
          )}
        </Stack>
      </SettingsSection>

      <SettingsSection title="Public profile">
        <Stack spacing={2} sx={{ maxWidth: 420 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText={
              !usernameOk && username
                ? "3–24 chars, lowercase, numbers, underscores"
                : usernameTaken
                  ? "Username taken"
                  : availability.data?.available && normalized !== user.username
                    ? "Available"
                    : undefined
            }
            error={Boolean(username && (!usernameOk || usernameTaken))}
            fullWidth
            size="small"
            sx={fieldSx}
          />
          <TextField
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={user.name && !user.fullName ? user.name : undefined}
            helperText={
              user.name && !user.fullName
                ? "Loaded from your existing profile name — save to store as full name"
                : undefined
            }
            fullWidth
            size="small"
            sx={fieldSx}
          />
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel id="settings-gender-label">Gender</InputLabel>
            <Select
              labelId="settings-gender-label"
              label="Gender"
              value={gender ?? ""}
              onChange={(e: SelectChangeEvent) => {
                const v = e.target.value;
                setGender(v === "" ? null : (v as PublicUser["gender"]));
              }}
              displayEmpty
              sx={selectSx}
            >
              <MenuItem value="">
                <em style={{ color: miui.textDim }}>Not specified</em>
              </MenuItem>
              {GENDER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            fullWidth
            size="small"
            sx={fieldSx}
          />

          {saveMsg && <Alert severity="success" sx={{ borderRadius: 0 }}>{saveMsg}</Alert>}
          {saveErr && <Alert severity="error" sx={{ borderRadius: 0 }}>{saveErr}</Alert>}

          <Box>
            <Button
              variant="contained"
              disabled={saveMutation.isPending || usernameTaken || (username.length > 0 && !usernameOk)}
              onClick={() => saveMutation.mutate()}
              sx={{ borderRadius: 0, textTransform: "none", fontWeight: 700 }}
            >
              {saveMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </Box>
        </Stack>
      </SettingsSection>
    </Stack>
  );
}

function SecuritySection() {
  const setSession = useAuthStore((s) => s.setSession);
  const [step, setStep] = useState<"idle" | "otp" | "password">("idle");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestOtp = async () => {
    setError("");
    try {
      const r = await authService.requestChangePasswordOtp();
      setMessage(r.message);
      setStep("otp");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Failed");
    }
  };

  const confirmChange = async () => {
    const pv = validatePassword(password);
    if (!pv.valid) {
      setError("Password does not meet requirements");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      const result = await authService.confirmChangePassword(code, password);
      setSession(result.user, result.accessToken);
      setMessage("Password updated");
      setStep("idle");
      setCode("");
      setPassword("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Failed");
    }
  };

  return (
    <SettingsSection title="Password">
      <Stack spacing={2} sx={{ maxWidth: 420 }}>
        {step === "idle" && (
          <Button
            variant="outlined"
            onClick={() => void requestOtp()}
            sx={{ borderRadius: 0, alignSelf: "flex-start", textTransform: "none" }}
          >
            Change password
          </Button>
        )}
        {step === "otp" && (
          <>
            <OtpInput value={code} onChange={setCode} />
            <Button
              variant="contained"
              onClick={() => setStep("password")}
              disabled={code.length !== 6}
              sx={{ borderRadius: 0, textTransform: "none" }}
            >
              Continue
            </Button>
          </>
        )}
        {step === "password" && (
          <>
            <TextField
              type="password"
              label="New password"
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={fieldSx}
            />
            <PasswordStrength password={password} />
            <TextField
              type="password"
              label="Confirm password"
              fullWidth
              size="small"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              sx={fieldSx}
            />
            <Button
              variant="contained"
              onClick={() => void confirmChange()}
              sx={{ borderRadius: 0, textTransform: "none" }}
            >
              Update password
            </Button>
          </>
        )}
        {message && <Alert severity="success" sx={{ borderRadius: 0 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}
      </Stack>
    </SettingsSection>
  );
}

function AccountSection() {
  const logout = useLogout();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* still clear client session */
    }
    logout();
  };

  return (
    <SettingsSection title="Session">
      <Stack spacing={2} sx={{ maxWidth: 420 }}>
        <Typography sx={{ fontSize: "0.875rem", color: miui.textMuted, lineHeight: 1.6 }}>
          Sign out on this device. Your session token will be invalidated on the server.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={() => void handleLogout()}
          sx={{ borderRadius: 0, alignSelf: "flex-start", textTransform: "none" }}
        >
          Sign out
        </Button>
      </Stack>
    </SettingsSection>
  );
}

const tabSx = {
  minHeight: 44,
  borderBottom: `1px solid ${miui.border}`,
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: miui.textDim,
    minHeight: 44,
    px: 0,
    mr: 3,
    minWidth: "auto",
    "&.Mui-selected": { color: miui.text },
  },
  "& .MuiTabs-indicator": {
    backgroundColor: miui.accent,
    height: 2,
  },
} as const;

export function SettingsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: miui.text, mb: 0.5 }}>
        Settings
      </Typography>
      <Typography sx={{ fontSize: "0.875rem", color: miui.textMuted, mb: 3 }}>
        Manage your CodeZero account
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={tabSx}>
        <Tab label="Profile" />
        <Tab label="Security" />
        <Tab label="Account" />
        <Tab label="Preferences" disabled />
      </Tabs>

      <Box sx={{ mt: 0 }}>
        {tab === 0 && <ProfileSection />}
        {tab === 1 && <SecuritySection />}
        {tab === 2 && <AccountSection />}
        {tab === 3 && (
          <Typography sx={{ py: 3, fontSize: "0.875rem", color: miui.textDim }}>
            Preferences coming soon.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
