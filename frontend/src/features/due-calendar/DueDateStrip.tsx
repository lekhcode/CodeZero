import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { dueCalendarApi } from "./due-calendar.api";
import { DOT_COLORS, dotToneForDay, getWeekDateKeys, weekBoundsFromKeys } from "./due-calendar.utils";
import { queryKeys } from "@/hooks/queryKeys";
import { getUtcDateKey } from "@/utils/date";
import { miui, miuiCardSx, monoStatSx } from "@/theme/theme";
import type { DayCell } from "./due-calendar.types";

export function DueDateStrip() {
  const todayKey = getUtcDateKey();
  const weekKeys = useMemo(() => getWeekDateKeys(), []);
  const { from, to } = weekBoundsFromKeys(weekKeys);

  const summaryQuery = useQuery({
    queryKey: queryKeys.dueCalendarSummaryWeek(from),
    queryFn: () => dueCalendarApi.getSummary(from, to),
    staleTime: 60_000,
  });

  const daysByDate = useMemo(() => {
    const map = new Map<string, DayCell>();
    for (const day of summaryQuery.data?.days ?? []) {
      map.set(day.date, day);
    }
    return map;
  }, [summaryQuery.data?.days]);

  return (
    <Box sx={{ ...miuiCardSx, p: 1.25, mb: 2 }}>
      <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
        This week
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75 }}>
        {weekKeys.map((dateKey) => {
          const cell = daysByDate.get(dateKey);
          const dot = dotToneForDay(cell);
          const isToday = dateKey === todayKey;
          const dayNum = Number(dateKey.slice(8, 10));
          const weekday = new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString(undefined, {
            weekday: "short",
            timeZone: "UTC",
          });

          return (
            <Box
              key={dateKey}
              component={RouterLink}
              to={`/today?tab=timeline&date=${dateKey}`}
              sx={{
                textDecoration: "none",
                color: "inherit",
                borderRadius: 1,
                py: 0.75,
                px: 0.25,
                textAlign: "center",
                border: isToday ? `1px solid ${miui.primary}` : `1px solid transparent`,
                bgcolor: miui.elevated,
                transition: "border-color 150ms ease, transform 150ms ease",
                "@media (prefers-reduced-motion: no-preference)": {
                  "&:hover": { transform: "translateY(-1px)", borderColor: miui.borderStrong },
                },
              }}
            >
              <Typography sx={{ fontSize: "0.625rem", color: miui.textMuted }}>{weekday}</Typography>
              <Typography sx={{ ...monoStatSx, fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.2 }}>
                {dayNum}
              </Typography>
              {dot !== "none" ? (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: DOT_COLORS[dot],
                    mx: "auto",
                    mt: 0.35,
                  }}
                />
              ) : (
                <Box sx={{ height: 6, mt: 0.35 }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
