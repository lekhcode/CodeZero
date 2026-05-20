import type { ReactNode } from "react";
import { Box, Typography, alpha } from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { DifficultyLevel, SubmissionListItem, SubmissionStatus } from "@/types/api.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { ProblemCatalogTableChrome } from "@/components/problems/ProblemCatalogTable";
import { difficultyColor } from "@/utils/difficulty";
import { miui } from "@/theme/theme";

dayjs.extend(relativeTime);

const GRID_COLS = "minmax(0, 1fr) 108px 64px 88px 20px";

const VERDICT_COLOR: Record<SubmissionStatus, string> = {
  ACCEPTED: miui.success,
  WRONG_ANSWER: miui.danger,
  RUNTIME_ERROR: miui.caution,
  COMPILATION_ERROR: miui.accent,
  TIME_LIMIT_EXCEEDED: miui.caution,
  INTERNAL_ERROR: miui.textMuted,
  QUEUED: miui.textMuted,
  RUNNING: miui.accent,
};

const VERDICT_SHORT: Record<SubmissionStatus, string> = {
  ACCEPTED: "AC",
  WRONG_ANSWER: "WA",
  RUNTIME_ERROR: "RE",
  COMPILATION_ERROR: "CE",
  TIME_LIMIT_EXCEEDED: "TLE",
  INTERNAL_ERROR: "ERR",
  QUEUED: "…",
  RUNNING: "…",
};

const headerSx = {
  display: "grid",
  gridTemplateColumns: GRID_COLS,
  alignItems: "center",
  gap: 1.5,
  px: 2,
  py: 1.25,
  bgcolor: miui.elevated,
  borderBottom: `1px solid ${miui.border}`,
  position: "sticky" as const,
  top: 0,
  zIndex: 2,
};

function HeaderCell({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "text.secondary",
        fontSize: "0.65rem",
        textAlign: align,
      }}
    >
      {children}
    </Typography>
  );
}

type SubmissionRunsTableProps = {
  submissions: SubmissionListItem[];
};

export function SubmissionRunsTable({ submissions }: SubmissionRunsTableProps) {
  return (
    <ProblemCatalogTableChrome>
      <Box sx={{ bgcolor: miui.paper }}>
        <Box sx={headerSx}>
          <HeaderCell>Problem</HeaderCell>
          <HeaderCell>Runtime</HeaderCell>
          <HeaderCell align="right">Verdict</HeaderCell>
          <HeaderCell align="right">When</HeaderCell>
          <span />
        </Box>

        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {submissions.map((submission, index) => {
            const difficulty = submission.problem.difficulty as DifficultyLevel;
            const accent = difficultyColor(difficulty);
            const verdictColor = VERDICT_COLOR[submission.status];
            const isLast = index === submissions.length - 1;
            const shaded = index % 2 === 1;
            const rowBg = shaded ? alpha(miui.text, 0.035) : miui.paper;
            const runtime =
              submission.runtimeMs !== null ? `${submission.runtimeMs} ms` : "—";
            const when = dayjs(submission.createdAt);
            const timeLabel = when.isAfter(dayjs().subtract(7, "day"))
              ? when.fromNow()
              : when.format("MMM D, HH:mm");

            return (
              <Box
                component="li"
                key={submission.id}
                sx={{
                  borderBottom: isLast ? "none" : `1px solid ${miui.border}`,
                  bgcolor: rowBg,
                }}
              >
                <Box
                  component={RouterLink}
                  to={`/problems/${submission.problem.slug}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: GRID_COLS,
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.15,
                    minHeight: 52,
                    textDecoration: "none",
                    color: "inherit",
                    position: "relative",
                    bgcolor: rowBg,
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: alpha(miui.primary, 0.07),
                      "& .run-chevron": { opacity: 1, transform: "translateX(2px)" },
                      "& .run-title": { color: "primary.main" },
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: 2,
                      bgcolor: accent,
                      opacity: 0,
                      transition: "opacity 0.15s ease",
                    },
                    "&:hover::before": { opacity: 1 },
                  }}
                >
                  <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography
                      className="run-title"
                      variant="body2"
                      sx={{
                        fontWeight: 650,
                        lineHeight: 1.35,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        minWidth: 0,
                        transition: "color 0.15s ease",
                      }}
                    >
                      {submission.problem.title}
                    </Typography>
                    <DifficultyChip difficulty={difficulty} />
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}
                  >
                    {submission.language}
                    <Box component="span" sx={{ color: miui.textMuted }}>
                      {" · "}
                      {runtime}
                    </Box>
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      justifySelf: "end",
                      fontWeight: 800,
                      color: verdictColor,
                      fontSize: "0.72rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {VERDICT_SHORT[submission.status]}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ justifySelf: "end", fontSize: "0.72rem", fontVariantNumeric: "tabular-nums" }}
                  >
                    {timeLabel}
                  </Typography>

                  <ChevronRightRoundedIcon
                    className="run-chevron"
                    sx={{
                      fontSize: 20,
                      color: "text.secondary",
                      opacity: 0.35,
                      justifySelf: "end",
                      transition: "opacity 0.15s ease, transform 0.15s ease",
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        {submissions.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            No submissions to show
          </Typography>
        )}
      </Box>
    </ProblemCatalogTableChrome>
  );
}
