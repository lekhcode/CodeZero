import { Box, Typography } from "@mui/material";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { miui, monoStatSx } from "@/theme/theme";

type StatItem = {
  label: string;
  value: number | string;
  variant: "todo" | "overdue" | "done";
  pulse?: boolean;
};

const DOT_COLOR: Record<StatItem["variant"], string> = {
  todo: miui.accent,
  overdue: miui.danger,
  done: miui.success,
};

export function StatsStrip({ items }: { items: StatItem[] }) {
  return (
    <Box
      className="today-stats-row"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        mb: 1.5,
        flexShrink: 0,
      }}
    >
      {items.map((item) => {
        const num = Number(item.value);
        const dotColor = DOT_COLOR[item.variant];
        const isOverdueActive = item.variant === "overdue" && num > 0;
        let valueColor: string = miui.text;
        if (item.variant === "overdue") {
          valueColor = num > 0 ? miui.danger : miui.textDim;
        } else if (item.variant === "done") {
          valueColor = num > 0 ? miui.success : miui.textDim;
        }

        return (
          <Box
            key={item.label}
            className={`stat-chip${isOverdueActive ? " overdue-active" : ""}`}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              bgcolor: miui.elevated,
              border: `1px solid ${miui.border}`,
              borderRadius: "8px",
              minWidth: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: dotColor,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 400,
                color: miui.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {item.label}
            </Typography>
            <Typography
              className={isOverdueActive ? "overdue-count" : undefined}
              component="span"
              sx={{
                ...monoStatSx,
                fontSize: "20px",
                fontWeight: 600,
                color: valueColor,
                lineHeight: 1,
                ml: 0.25,
              }}
            >
              {typeof item.value === "number" ? <AnimatedNumber value={num} /> : item.value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
