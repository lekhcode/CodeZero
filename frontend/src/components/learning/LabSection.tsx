import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { labPanelSx, sectionContentSx } from "@/theme/theme";

type LabSectionProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  accent?: string;
};

export function LabSection({ title, subtitle, action, children }: LabSectionProps) {
  return (
    <Box sx={{ ...labPanelSx, ...sectionContentSx, mb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ mb: 2, justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              color: "primary.main",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ position: "relative", zIndex: 1 }}>{action}</Box>}
      </Stack>
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
