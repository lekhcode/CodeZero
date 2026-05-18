import { Typography, alpha } from "@mui/material";
import type { ReactNode } from "react";
import { AnimatedBanner } from "@/components/ui/AnimatedBanner";
import { miui } from "@/theme/theme";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  action?: ReactNode;
};

export function PageHeader({ title, subtitle, eyebrow, action }: PageHeaderProps) {
  return (
    <AnimatedBanner
      sx={{
        mb: 4,
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 4,
        background: `linear-gradient(135deg, ${alpha(miui.primary, 0.1)} 0%, ${alpha(miui.accent, 0.06)} 100%)`,
        border: `1px solid ${alpha(miui.primary, 0.14)}`,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <div>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              letterSpacing: "0.12em",
              display: "block",
              mb: 0.5,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            fontSize: { xs: "1.65rem", sm: "2rem" },
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 1, maxWidth: 560, lineHeight: 1.6, fontSize: "1rem" }}
        >
          {subtitle}
        </Typography>
      </div>
      {action}
    </AnimatedBanner>
  );
}
