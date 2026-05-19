import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { CalendarGrid } from "./CalendarGrid";
import { DayDetailPanel } from "./DayDetailPanel";
import { dueCalendarApi } from "./due-calendar.api";
import {
  addUtcDays,
  findDefaultSelectedDate,
  monthRangeKeys,
} from "./due-calendar.utils";
import { queryKeys } from "@/hooks/queryKeys";
import { getUtcDateKey } from "@/utils/date";
import { miui, sectionCardSx } from "@/theme/theme";
import type { DayCell } from "./due-calendar.types";

type DueCalendarProps = {
  initialDate?: string;
  onSelectedDateChange?: (date: string) => void;
};

export function DueCalendar({ initialDate, onSelectedDateChange }: DueCalendarProps) {
  const todayKey = getUtcDateKey();
  const initialParts = initialDate?.split("-").map(Number) ?? todayKey.split("-").map(Number);
  const [year, setYear] = useState(initialParts[0] ?? new Date().getUTCFullYear());
  const [monthIndex, setMonthIndex] = useState((initialParts[1] ?? 1) - 1);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate ?? todayKey);
  const rootRef = useRef<HTMLDivElement>(null);
  const bootstrappedRef = useRef(false);

  const { from, to } = useMemo(() => monthRangeKeys(year, monthIndex), [year, monthIndex]);

  const summaryQuery = useQuery({
    queryKey: queryKeys.dueCalendarSummary(year, monthIndex),
    queryFn: () => dueCalendarApi.getSummary(from, to),
  });

  const daysByDate = useMemo(() => {
    const map = new Map<string, DayCell>();
    for (const day of summaryQuery.data?.days ?? []) {
      map.set(day.date, day);
    }
    return map;
  }, [summaryQuery.data?.days]);

  const dayQuery = useQuery({
    queryKey: queryKeys.dueCalendarDay(selectedDate),
    queryFn: () => dueCalendarApi.getDay(selectedDate),
    enabled: selectedDate <= todayKey,
  });

  const setDate = useCallback(
    (date: string) => {
      if (date > todayKey) return;
      setSelectedDate(date);
      onSelectedDateChange?.(date);
      const [y, m] = date.split("-").map(Number);
      if (y !== undefined && m !== undefined) {
        setYear(y);
        setMonthIndex(m - 1);
      }
    },
    [onSelectedDateChange, todayKey],
  );

  useEffect(() => {
    if (summaryQuery.data === undefined || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    const next = findDefaultSelectedDate(summaryQuery.data.days, todayKey, initialDate);
    setDate(next);
  }, [summaryQuery.data, todayKey, initialDate, setDate]);

  useEffect(() => {
    if (initialDate === undefined || initialDate > todayKey) return;
    setDate(initialDate);
  }, [initialDate, setDate, todayKey]);

  useEffect(() => {
    const el = rootRef.current;
    if (el === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      const next = addUtcDays(selectedDate, delta);
      if (next > todayKey) return;
      setDate(next);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDate, setDate, todayKey]);

  const onPrevMonth = () => {
    if (monthIndex === 0) {
      setYear((y) => y - 1);
      setMonthIndex(11);
    } else {
      setMonthIndex((m) => m - 1);
    }
  };

  const onNextMonth = () => {
    if (monthIndex === 11) {
      setYear((y) => y + 1);
      setMonthIndex(0);
    } else {
      setMonthIndex((m) => m + 1);
    }
  };

  return (
    <Box
      ref={rootRef}
      tabIndex={-1}
      sx={{
        ...sectionCardSx,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: { xs: "auto", md: 520 },
        minHeight: { xs: 480, md: 520 },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: 300 },
          flexShrink: 0,
          borderRight: { md: `1px solid ${miui.border}` },
          borderBottom: { xs: `1px solid ${miui.border}`, md: "none" },
          p: 1.5,
          minHeight: { xs: 320, md: 0 },
          maxHeight: { xs: 360, md: "none" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CalendarGrid
          year={year}
          monthIndex={monthIndex}
          daysByDate={daysByDate}
          selectedDate={selectedDate}
          todayKey={todayKey}
          onSelectDate={setDate}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, p: 2, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <DayDetailPanel
          selectedDate={selectedDate}
          data={dayQuery.data}
          isLoading={dayQuery.isLoading}
          isError={dayQuery.isError}
        />
      </Box>
    </Box>
  );
}
