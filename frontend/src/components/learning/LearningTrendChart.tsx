import { useMemo, useState, useCallback, useRef } from "react";
import { Box, Typography, alpha } from "@mui/material";
import dayjs from "dayjs";
import type { LearningInsights } from "@/types/api.types";
import { miui, sectionCardSx, sectionContentSx } from "@/theme/theme";

/** viewBox units — geometry only; labels live in HTML */
const VB_W = 300;
const VB_H = 64;
const PAD_X = 6;
const PAD_Y = 8;

type LearningTrendChartProps = {
  insights: LearningInsights;
};

type PlotPoint = {
  date: string;
  value: number;
  cumulative: number;
};

function chartValue(d: LearningInsights["dailyPoints"][0]): number {
  return d.solvedCount > 0 ? d.solvedCount : d.acceptedCount;
}

function smoothLinePath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) {
    const c = coords[0]!;
    return `M ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  if (coords.length === 2) {
    return `M ${coords[0]!.x.toFixed(1)} ${coords[0]!.y.toFixed(1)} L ${coords[1]!.x.toFixed(1)} ${coords[1]!.y.toFixed(1)}`;
  }

  let d = `M ${coords[0]!.x.toFixed(1)} ${coords[0]!.y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]!;
    const p1 = coords[i]!;
    const p2 = coords[i + 1]!;
    const p3 = coords[Math.min(coords.length - 1, i + 2)]!;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function buildPlot(points: LearningInsights["dailyPoints"]): PlotPoint[] {
  let cumulative = 0;
  return points.map((p) => {
    const value = chartValue(p);
    cumulative += value;
    return { date: p.date, value, cumulative };
  });
}

export function LearningTrendChart({ insights }: LearningTrendChartProps) {
  const plot = useMemo(() => buildPlot(insights.dailyPoints), [insights.dailyPoints]);
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const lastIndex = Math.max(0, plot.length - 1);
  const hoverIndex = activeIndex ?? lastIndex;
  const active = plot[hoverIndex];
  const hasActivity = plot.some((p) => p.cumulative > 0);

  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y * 2;
  const maxY = Math.max(1, plot[plot.length - 1]?.cumulative ?? 0);

  const coords = plot.map((p, i) => {
    const x = PAD_X + (plot.length <= 1 ? innerW / 2 : (i / (plot.length - 1)) * innerW);
    const y = PAD_Y + innerH - (p.cumulative / maxY) * innerH;
    return { x, y };
  });

  const linePath = smoothLinePath(coords);
  const areaPath =
    linePath && coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1]!.x.toFixed(1)} ${PAD_Y + innerH} L ${coords[0]!.x.toFixed(1)} ${PAD_Y + innerH} Z`
      : "";

  const hoverPct = plot.length <= 1 ? 0.5 : hoverIndex / (plot.length - 1);

  const pickIndex = useCallback(
    (clientX: number) => {
      const el = chartRef.current;
      if (!el || plot.length === 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setActiveIndex(Math.round(ratio * (plot.length - 1)));
    },
    [plot.length],
  );

  const firstDate = plot[0]?.date;
  const lastDate = plot[lastIndex]?.date;

  return (
    <Box sx={{ ...sectionCardSx, ...sectionContentSx, borderRadius: 2, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.75rem" }}>
          Progress · {insights.rangeDays}d
        </Typography>
        {hasActivity && active && (
          <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.75rem" }}>
            {active.cumulative} total
            {activeIndex !== null && (
              <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, ml: 0.5 }}>
                · {dayjs(active.date).format("MMM D")}
              </Box>
            )}
          </Typography>
        )}
      </Box>

      <Box
        ref={chartRef}
        onMouseMove={(e) => pickIndex(e.clientX)}
        onMouseLeave={() => setActiveIndex(null)}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) pickIndex(t.clientX);
        }}
        sx={{
          position: "relative",
          height: 72,
          borderRadius: 1.5,
          bgcolor: alpha(miui.primary, 0.04),
          border: `1px solid ${miui.border}`,
          cursor: hasActivity ? "crosshair" : "default",
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          aria-hidden
          style={{ display: "block" }}
        >
          {[0.5].map((pct) => (
            <line
              key={pct}
              x1={PAD_X}
              x2={VB_W - PAD_X}
              y1={PAD_Y + innerH * (1 - pct)}
              y2={PAD_Y + innerH * (1 - pct)}
              stroke={miui.border}
              strokeWidth={1}
            />
          ))}

          {hasActivity && areaPath && (
            <path d={areaPath} fill={alpha(miui.primary, 0.12)} stroke="none" />
          )}

          {hasActivity && linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={miui.primary}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {!hasActivity && (
            <line
              x1={PAD_X}
              y1={PAD_Y + innerH}
              x2={VB_W - PAD_X}
              y2={PAD_Y + innerH}
              stroke={miui.border}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}

          {hasActivity && (
            <line
              x1={PAD_X + hoverPct * innerW}
              x2={PAD_X + hoverPct * innerW}
              y1={PAD_Y}
              y2={PAD_Y + innerH}
              stroke={alpha(miui.primary, 0.25)}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {hasActivity && active && (
          <>
            <Box
              sx={{
                position: "absolute",
                left: `${hoverPct * 100}%`,
                top: `${((PAD_Y + innerH - (active.cumulative / maxY) * innerH) / VB_H) * 100}%`,
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: miui.paper,
                border: `2px solid ${miui.primary}`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                boxShadow: `0 1px 4px ${alpha(miui.primary, 0.35)}`,
              }}
            />
            {activeIndex !== null && (
              <Box
                sx={{
                  position: "absolute",
                  left: `${hoverPct * 100}%`,
                  top: 6,
                  transform: "translateX(-50%)",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: miui.paper,
                  border: `1px solid ${miui.border}`,
                  boxShadow: `0 2px 8px ${alpha("#000", 0.08)}`,
                  pointerEvents: "none",
                }}
              >
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontWeight: 700, fontSize: "0.6875rem", color: "primary.main", lineHeight: 1.2 }}
                >
                  {active.cumulative}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6875rem" }}>
          {firstDate ? dayjs(firstDate).format("MMM D") : "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6875rem" }}>
          {lastDate ? dayjs(lastDate).format("MMM D") : "—"}
        </Typography>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 0.5, fontSize: "0.6875rem", lineHeight: 1.35 }}
      >
        {insights.totalSolvedInRange} solved · {insights.consistencyPercent}% active (14d)
      </Typography>
    </Box>
  );
}
