import { Box, alpha, type SxProps, type Theme } from "@mui/material";
import { Link } from "react-router-dom";
import { CodeZeroLogo } from "./CodeZeroLogo";
import { miui } from "@/theme/theme";

type CodeZeroBrandLinkProps = {
  size?: number;
  compact?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
};

export function CodeZeroBrandLink({
  size = 36,
  compact = false,
  onClick,
  sx,
}: CodeZeroBrandLinkProps) {
  return (
    <Box
      component={Link}
      to="/dashboard"
      onClick={onClick}
      aria-label="CodeZero — dashboard"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
        borderRadius: 3,
        px: compact ? 0 : 0.5,
        py: 0.25,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          bgcolor: alpha(miui.primary, 0.06),
          boxShadow: `0 6px 20px ${alpha(miui.primary, 0.15)}`,
        },
        "&:active": { transform: "translateY(0)" },
        "&:focus-visible": {
          outline: `2px solid ${miui.primary}`,
          outlineOffset: 3,
        },
        ...sx,
      }}
    >
      <CodeZeroLogo size={size} compact={compact} />
    </Box>
  );
}
