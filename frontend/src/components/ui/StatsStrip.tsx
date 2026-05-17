import { Box, Grid, Typography, alpha } from "@mui/material";
import { miui, sectionCardSx, sectionContentSx } from "@/theme/theme";

type StatItem = {
  label: string;
  value: number | string;
  color?: string;
};

export function StatsStrip({ items }: { items: StatItem[] }) {
  return (
    <Box sx={{ ...sectionCardSx, ...sectionContentSx, mb: 1.5, flexShrink: 0 }}>
      <Grid container spacing={1} sx={{ width: "100%", m: 0 }}>
        {items.map((item) => (
          <Grid key={item.label} size={{ xs: 6, sm: 3 }}>
            <Box
              sx={{
                px: 1.25,
                py: 0.85,
                borderRadius: 1.5,
                bgcolor: alpha(item.color ?? miui.primary, 0.06),
                minWidth: 0,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.62rem", display: "block", lineHeight: 1.2 }}
                noWrap
              >
                {item.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: item.color ?? "text.primary",
                  lineHeight: 1.2,
                }}
                noWrap
              >
                {item.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
