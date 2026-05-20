import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { submissionsService } from "@/services/submissions.service";
import { queryKeys } from "@/hooks/queryKeys";
import { getUtcDateKey } from "@/utils/date";
import { miui, monoStatSx } from "@/theme/theme";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

function getWeekDaysMonSun(reference = new Date()): string[] {
  const ref = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()),
  );
  const dow = ref.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const start = new Date(ref);
  start.setUTCDate(ref.getUTCDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return getUtcDateKey(d);
  });
}

function repBarHeight(count: number): string {
  if (count <= 0) return "0%";
  const pct = Math.min(100, Math.max(20, count * 20));
  return `${pct}%`;
}

type DayState = "future" | "today" | "solved" | "missed";

export function WeekBelt() {
  const todayKey = getUtcDateKey();
  const weekKeys = useMemo(() => getWeekDaysMonSun(), []);

  const activityQuery = useQuery({
    queryKey: queryKeys.submissionActivity("rolling"),
    queryFn: () => submissionsService.getActivity({ rolling: true }),
    staleTime: 60_000,
  });

  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of activityQuery.data?.days ?? []) {
      map.set(day.date, day.count);
    }
    return map;
  }, [activityQuery.data?.days]);

  const acceptedByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of activityQuery.data?.days ?? []) {
      map.set(day.date, day.acceptedCount);
    }
    return map;
  }, [activityQuery.data?.days]);

  const weekStats = useMemo(() => {
    let activeDays = 0;
    let totalSolved = 0;
    for (const key of weekKeys) {
      const c = countByDate.get(key) ?? 0;
      if (key <= todayKey && c > 0) {
        activeDays += 1;
        totalSolved += c;
      }
    }
    return { activeDays, totalSolved };
  }, [weekKeys, countByDate, todayKey]);

  const streak = activityQuery.data?.currentStreak ?? 0;

  return (
    <Box
      sx={{
        bgcolor: miui.paper,
        border: `1px solid ${miui.border}`,
        borderRadius: "14px",
        p: "20px 24px",
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {weekKeys.map((dateKey, index) => {
          const isToday = dateKey === todayKey;
          const isFuture = dateKey > todayKey;
          const solvedCount = countByDate.get(dateKey) ?? 0;
          const acceptedCount = acceptedByDate.get(dateKey) ?? 0;
          let state: DayState = "missed";
          if (isFuture) state = "future";
          else if (isToday) state = "today";
          else if (acceptedCount > 0) state = "solved";

          return (
            <Box
              key={dateKey}
              {...(isFuture
                ? {}
                : {
                    component: RouterLink,
                    to: `/today?tab=timeline&date=${dateKey}`,
                  })}
              sx={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
                cursor: isFuture ? "default" : "pointer",
                transition: "transform 150ms ease",
                ...(!isFuture
                  ? {
                      "@media (prefers-reduced-motion: no-preference)": {
                        "&:hover": { transform: "translateY(-2px)" },
                      },
                    }
                  : {}),
              }}
            >
              <Typography
                sx={{
                  fontFamily: "var(--font-number)",
                  fontSize: "10px",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  color: isToday ? miui.accent : miui.textDim,
                  letterSpacing: "0.06em",
                }}
              >
                {DAY_LABELS[index]}
              </Typography>

              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "10px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(state === "future"
                    ? {
                        bgcolor: "transparent",
                        border: `1px dashed ${miui.border}`,
                        opacity: 0.4,
                      }
                    : state === "today"
                      ? {
                          bgcolor: miui.active,
                          border: `1.5px solid ${miui.accent}`,
                          boxShadow: `0 0 10px ${miui.accentGlow}`,
                        }
                      : state === "solved"
                        ? {
                            bgcolor: miui.active,
                            border: `1px solid ${miui.accentBorder}`,
                          }
                        : {
                            bgcolor: miui.paper,
                            border: `1px solid ${miui.border}`,
                          }),
                }}
              >
                {state === "solved" ? (
                  <>
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        top: 8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 4,
                        borderRadius: "2px",
                        bgcolor: miui.elevated,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          height: repBarHeight(solvedCount),
                          bgcolor: miui.accent,
                          borderRadius: "2px",
                          transition: "height 150ms ease",
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        position: "absolute",
                        right: 4,
                        bottom: 4,
                        ...monoStatSx,
                        fontSize: "10px",
                        fontWeight: 400,
                        color: miui.accent,
                        lineHeight: 1,
                      }}
                    >
                      {solvedCount}
                    </Typography>
                  </>
                ) : null}

                {state === "missed" ? (
                  <CloseRoundedIcon sx={{ fontSize: 14, color: miui.textGhost }} />
                ) : null}
              </Box>

              {state === "today" ? (
                <Typography
                  sx={{
                    fontFamily: "var(--font-number)",
                    fontSize: "9px",
                    color: miui.accent,
                    fontWeight: 400,
                    letterSpacing: "0.08em",
                  }}
                >
                  TODAY
                </Typography>
              ) : (
                <Typography
                  sx={{
                    ...monoStatSx,
                    fontSize: "11px",
                    fontWeight: 400,
                    color: solvedCount > 0 ? miui.accent : miui.textGhost,
                    minHeight: 14,
                  }}
                >
                  {state === "future" ? "" : solvedCount > 0 ? solvedCount : "—"}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontSize: "12px", fontWeight: 400, color: miui.textMuted }}>
          Week progress: {weekStats.activeDays}/7 days active · {weekStats.totalSolved} full submits
        </Typography>
        {streak > 0 ? (
          <Box className={streak > 0 ? "streak-active" : "streak-inactive"}>
            <Typography
              component="span"
              className="streak-fire-icon"
              sx={{ mr: 0.5 }}
            >
              🔥
            </Typography>
            <Typography
              component="span"
              className="streak-number"
              sx={{
                ...monoStatSx,
                fontSize: "12px",
                fontWeight: 400,
              }}
            >
              {streak} day streak
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
