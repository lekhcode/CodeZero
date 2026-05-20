import { Typography } from "@mui/material";
import { miui } from "@/theme/theme";

const COPYRIGHT_YEAR = 2026;

type AppCopyrightProps = {
  /** Hide long text when sidebar is collapsed (icon-only). */
  collapsed?: boolean;
  align?: "left" | "center";
};

export function AppCopyright({ collapsed = false, align = "left" }: AppCopyrightProps) {
  if (collapsed) {
    return (
      <Typography
        component="p"
        title={`© ${COPYRIGHT_YEAR} CodeZero`}
        sx={{
          m: 0,
          textAlign: "center",
          fontSize: "0.5625rem",
          color: miui.textDim,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
        }}
      >
        ©
      </Typography>
    );
  }

  return (
    <Typography
      component="p"
      sx={{
        m: 0,
        textAlign: align,
        fontSize: "0.6875rem",
        lineHeight: 1.4,
        color: miui.textDim,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.02em",
      }}
    >
      © {COPYRIGHT_YEAR} CodeZero. All rights reserved.
    </Typography>
  );
}
