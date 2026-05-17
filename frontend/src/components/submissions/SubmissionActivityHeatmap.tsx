import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import type { SubmissionActivitySummary } from "@/types/api.types";
import { miui } from "@/theme/theme";

const ROLLING_VALUE = "rolling";

type WeekColumn = Array<{ date: string; count: number } | null>;

type MonthBlock = {
  monthKey: string;
  label: string;
  weeks: WeekColumn[];
};

/** Parse YYYY-MM-DD in local calendar (avoids UTC shift). */
function parseLocalDate(dateStr: string): Dayjs {
  const [y, m, d] = dateStr.split("-").map(Number);
  return dayjs(new Date(y!, m! - 1, d!));
}

function intensityLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/** One month only: pad to weekday of 1st, then exactly that month's days in Sun–Sat columns. */
function weeksForMonth(monthDays: SubmissionActivitySummary["days"]): WeekColumn[] {
  if (monthDays.length === 0) return [];

  const first = parseLocalDate(monthDays[0]!.date);
  const monthKey = first.format("YYYY-MM");
  const weeks: WeekColumn[] = [];
  let bucket: WeekColumn = Array.from({ length: first.day() }, () => null);

  for (const day of monthDays) {
    const d = parseLocalDate(day.date);
    if (d.format("YYYY-MM") !== monthKey) continue;

    bucket.push({ date: day.date, count: day.count });
    if (bucket.length === 7) {
      weeks.push(bucket);
      bucket = [];
    }
  }

  if (bucket.length > 0) {
    while (bucket.length < 7) bucket.push(null);
    weeks.push(bucket);
  }

  return weeks;
}

/** Each calendar month is an isolated block — days never leak across month labels. */
function buildMonthBlocks(days: SubmissionActivitySummary["days"]): MonthBlock[] {
  if (days.length === 0) return [];

  const byMonth = new Map<string, SubmissionActivitySummary["days"]>();
  for (const day of days) {
    const mk = parseLocalDate(day.date).format("YYYY-MM");
    const list = byMonth.get(mk);
    if (list) list.push(day);
    else byMonth.set(mk, [day]);
  }

  return [...byMonth.keys()]
    .sort()
    .map((monthKey) => {
      const monthDays = byMonth.get(monthKey)!;
      return {
        monthKey,
        label: parseLocalDate(`${monthKey}-01`).format("MMM"),
        weeks: weeksForMonth(monthDays),
      };
    });
}

export type ActivityYearSelection = number | typeof ROLLING_VALUE;

type SubmissionActivityHeatmapProps = {
  activity: SubmissionActivitySummary;
  selection: ActivityYearSelection;
  onSelectionChange: (value: ActivityYearSelection) => void;
};

export function SubmissionActivityHeatmap({
  activity,
  selection,
  onSelectionChange,
}: SubmissionActivityHeatmapProps) {
  const monthBlocks = buildMonthBlocks(activity.days);
  const selectValue = selection === ROLLING_VALUE ? ROLLING_VALUE : String(selection);

  return (
    <Box sx={{ width: "100%", boxSizing: "border-box", minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.25,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
          <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
            {activity.totalSubmissions}
          </Box>{" "}
          submissions · {activity.rangeLabel}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <StatInline label="Active days" value={activity.activeDays} />
          <StatInline label="Max streak" value={activity.maxStreak} hint="Accepted" />
          <FormControl size="small" sx={{ minWidth: 128 }}>
            <Select
              value={selectValue}
              onChange={(e) => {
                const v = e.target.value;
                onSelectionChange(v === ROLLING_VALUE ? ROLLING_VALUE : Number(v));
              }}
              sx={{
                fontSize: "0.78rem",
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: alpha(miui.primary, 0.06),
                "& .MuiOutlinedInput-notchedOutline": { borderColor: miui.border },
              }}
            >
              <MenuItem value={ROLLING_VALUE} sx={{ fontSize: "0.85rem" }}>
                Last 12 months
              </MenuItem>
              {activity.availableYears.map((y) => (
                <MenuItem key={y} value={String(y)} sx={{ fontSize: "0.85rem" }}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ width: "100%", overflowX: "auto", pb: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", minWidth: "min-content", py: 0.25 }}>
          {monthBlocks.map((block, bi) => (
            <Box
              key={block.monthKey}
              sx={{
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
                mr: bi < monthBlocks.length - 1 ? 2.5 : 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  color: "text.disabled",
                  fontWeight: 600,
                  mb: 0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {block.label}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.35 }}>
                {block.weeks.map((week, wi) => (
                  <Box key={`${block.monthKey}-w${wi}`} sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
                    {week.map((cell, di) => (
                      <HeatCell
                        key={cell ? cell.date : `${block.monthKey}-w${wi}-p${di}`}
                        cell={cell}
                        isToday={isTodayCell(cell)}
                      />
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
          mt: 0.75,
        }}
      >
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", mr: 0.5 }}>
          Less
        </Typography>
        {miui.heatmap.map((color, i) => (
          <Box
            key={i}
            sx={{
              width: 10,
              height: 10,
              borderRadius: 0.5,
              bgcolor: color,
              border: i === 0 ? `1px solid ${miui.border}` : "none",
            }}
          />
        ))}
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", ml: 0.5 }}>
          More
        </Typography>
      </Box>
    </Box>
  );
}

function isTodayCell(cell: { date: string; count: number } | null): boolean {
  if (cell === null) return false;
  return cell.date === dayjs().format("YYYY-MM-DD");
}

function StatInline({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.62rem", display: "block" }}>
        {label}
        {hint ? ` · ${hint}` : ""}
      </Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Box>
  );
}

function HeatCell({
  cell,
  isToday,
}: {
  cell: { date: string; count: number } | null;
  isToday: boolean;
}) {
  if (cell === null) {
    return <Box sx={{ width: 10, height: 10 }} />;
  }

  const level = intensityLevel(cell.count);
  const color = miui.heatmap[level] ?? miui.heatmap[0];
  const label =
    cell.count === 0
      ? `No submissions · ${parseLocalDate(cell.date).format("MMM D, YYYY")}`
      : `${cell.count} on ${parseLocalDate(cell.date).format("MMM D, YYYY")}`;

  return (
    <Tooltip title={label} arrow placement="top">
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: 0.5,
          bgcolor: color,
          boxSizing: "border-box",
          border: isToday
            ? `2px solid ${miui.primary}`
            : level === 0
              ? `1px solid ${miui.border}`
              : "none",
          cursor: cell.count > 0 ? "pointer" : "default",
          transition: "transform 0.12s ease",
          "&:hover": cell.count > 0 ? { transform: "scale(1.2)" } : undefined,
        }}
      />
    </Tooltip>
  );
}

export { ROLLING_VALUE };
