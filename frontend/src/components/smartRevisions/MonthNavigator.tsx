import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { miui } from "@/theme/theme";

type MonthNavigatorProps = {
  label: string;
  monthOffset: number;
  onChange: (offset: number) => void;
  disableNext?: boolean;
};

export function MonthNavigator({
  label,
  monthOffset,
  onChange,
  disableNext = false,
}: MonthNavigatorProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
      <IconButton
        size="small"
        aria-label="Previous month"
        onClick={() => onChange(monthOffset - 1)}
        sx={{ border: `1px solid ${miui.border}` }}
      >
        <ChevronLeftRoundedIcon fontSize="small" />
      </IconButton>
      <Typography
        sx={{
          fontFamily: "var(--font-number)",
          fontSize: "12px",
          color: miui.textMuted,
          textAlign: "center",
          flex: 1,
        }}
      >
        {monthOffset === 0 ? `This month (${label})` : label}
      </Typography>
      <IconButton
        size="small"
        aria-label="Next month"
        disabled={disableNext}
        onClick={() => onChange(monthOffset + 1)}
        sx={{ border: `1px solid ${miui.border}` }}
      >
        <ChevronRightRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
