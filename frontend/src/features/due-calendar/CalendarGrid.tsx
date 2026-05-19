import { useMemo } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { DayCell } from "./due-calendar.types";
import {
  DOT_COLORS,
  buildCalendarGrid,
  dotToneForDay,
} from "./due-calendar.utils";
import { miui } from "@/theme/theme";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type CalendarGridProps = {
  year: number;
  monthIndex: number;
  daysByDate: Map<string, DayCell>;
  selectedDate: string;
  todayKey: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function CalendarGrid({
  year,
  monthIndex,
  daysByDate,
  selectedDate,
  todayKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const cells = useMemo(() => buildCalendarGrid(year, monthIndex), [year, monthIndex]);
  const monthLabel = useMemo(
    () =>
      new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    [year, monthIndex],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <IconButton size="small" onClick={onPrevMonth} aria-label="Previous month">
          <ChevronLeftRoundedIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="subtitle2"
          sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}
        >
          {monthLabel}
        </Typography>
        <IconButton size="small" onClick={onNextMonth} aria-label="Next month">
          <ChevronRightRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
          mb: 0.75,
          flexShrink: 0,
        }}
      >
        {WEEKDAYS.map((label) => (
          <Typography
            key={label}
            variant="caption"
            sx={{ textAlign: "center", fontSize: "0.65rem", color: miui.textDim }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
          flex: 1,
          alignContent: "start",
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {cells.map((dateKey, index) => {
          if (dateKey === null) {
            return <Box key={`pad-${index}`} sx={{ aspectRatio: "1", minHeight: 36 }} />;
          }

          const isFuture = dateKey > todayKey;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const cell = daysByDate.get(dateKey);
          const dot = dotToneForDay(cell);

          return (
            <Box
              key={dateKey}
              component={isFuture ? "div" : "button"}
              type={isFuture ? undefined : "button"}
              onClick={isFuture ? undefined : () => onSelectDate(dateKey)}
              disabled={isFuture}
              sx={{
                aspectRatio: "1",
                minHeight: 36,
                border: "none",
                borderRadius: 1,
                p: 0.25,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                cursor: isFuture ? "default" : "pointer",
                bgcolor: isSelected ? miui.primary : "transparent",
                color: isSelected ? miui.bg : isFuture ? miui.textDim : miui.text,
                outline: isToday ? `2px solid ${miui.primary}` : "none",
                outlineOffset: isSelected ? 0 : 1,
                opacity: isFuture ? 0.45 : 1,
                transition: "background-color 150ms ease, color 150ms ease",
                "&:hover": isFuture
                  ? undefined
                  : {
                      bgcolor: isSelected ? miui.primary : miui.hover,
                    },
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: isSelected ? 700 : 500,
                  lineHeight: 1,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {Number(dateKey.slice(8, 10))}
              </Typography>
              {!isFuture && dot !== "none" ? (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: DOT_COLORS[dot],
                  }}
                />
              ) : (
                <Box sx={{ width: 6, height: 6 }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
