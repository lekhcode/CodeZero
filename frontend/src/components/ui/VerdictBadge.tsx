import { Chip, alpha } from "@mui/material";
import type { SubmissionStatus } from "@/types/api.types";

const VERDICT_META: Record<
  SubmissionStatus,
  { label: string; color: string; bg: string }
> = {
  ACCEPTED: { label: "Accepted", color: "#059669", bg: "#059669" },
  WRONG_ANSWER: { label: "Wrong Answer", color: "#dc2626", bg: "#dc2626" },
  RUNTIME_ERROR: { label: "Runtime Error", color: "#d97706", bg: "#d97706" },
  COMPILATION_ERROR: { label: "Compile Error", color: "#7c3aed", bg: "#7c3aed" },
  TIME_LIMIT_EXCEEDED: { label: "TLE", color: "#ea580c", bg: "#ea580c" },
  INTERNAL_ERROR: { label: "Error", color: "#64748b", bg: "#64748b" },
  QUEUED: { label: "Queued", color: "#64748b", bg: "#64748b" },
  RUNNING: { label: "Running", color: "#0ea5e9", bg: "#0ea5e9" },
};

type VerdictBadgeProps = {
  status: SubmissionStatus;
  size?: "small" | "medium";
};

export function VerdictBadge({ status, size = "small" }: VerdictBadgeProps) {
  const meta = VERDICT_META[status];
  return (
    <Chip
      label={meta.label}
      size={size}
      sx={{
        fontWeight: 800,
        letterSpacing: "0.02em",
        color: meta.color,
        bgcolor: alpha(meta.bg, 0.1),
        border: `1px solid ${alpha(meta.bg, 0.25)}`,
        boxShadow: status === "ACCEPTED" ? `0 0 12px ${alpha(meta.bg, 0.2)}` : "none",
      }}
    />
  );
}
