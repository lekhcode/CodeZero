import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { miui } from "@/theme/theme";

type WeekNavigatorProps = {
  label: string;
  weekOffset: number;
  onChange: (offset: number) => void;
  disableNext?: boolean;
};

export function WeekNavigator({ label, weekOffset, onChange, disableNext = false }: WeekNavigatorProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
      <IconButton
        size="small"
        aria-label="Previous week"
        onClick={() => onChange(weekOffset - 1)}
        sx={{ border: `1px solid ${miui.border}` }}
      >
        <ChevronLeftRoundedIcon fontSize="small" />
      </IconButton>
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "12px",
          color: miui.textMuted,
          textAlign: "center",
          flex: 1,
        }}
      >
        {weekOffset === 0 ? `This week (${label})` : label}
      </Typography>
      <IconButton
        size="small"
        aria-label="Next week"
        disabled={disableNext}
        onClick={() => onChange(weekOffset + 1)}
        sx={{ border: `1px solid ${miui.border}` }}
      >
        <ChevronRightRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
