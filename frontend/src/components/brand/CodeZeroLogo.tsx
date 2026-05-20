import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import { CodeZeroMark } from "./CodeZeroMark";
import { miui } from "@/theme/theme";

type CodeZeroLogoProps = {
  size?: number;
  compact?: boolean;
  sx?: SxProps<Theme>;
};

export function CodeZeroLogo({ size = 36, compact = false, sx }: CodeZeroLogoProps) {
  const markSize = size;
  const pad = 4;
  const fontSize = compact ? 0 : Math.max(1, size / 20);

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 0 : 0.35,
        flexShrink: 0,
        ...sx,
      }}
    >
      {!compact && (
        <Typography
          component="span"
          aria-hidden
          sx={{
            fontFamily: "var(--font-number)",
            fontWeight: 800,
            fontSize: `${fontSize}rem`,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          <Box component="span" sx={{ color: miui.text }}>
            c
          </Box>
          <Box component="span" sx={{ color: miui.textMuted, mx: 0.02 }}>
            {"<>"}
          </Box>
          <Box component="span" sx={{ color: miui.text }}>
            de
          </Box>
        </Typography>
      )}

      <Box
        className="zero-mark-spin-host"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: markSize + pad * 2,
          height: markSize + pad * 2,
          minWidth: markSize + pad * 2,
          ml: compact ? 0 : -0.15,
          borderRadius: 2,
          bgcolor: miui.elevated,
          border: `1px solid ${miui.brandOrangeBorder}`,
          boxShadow: `0 0 14px ${miui.brandOrangeSoft}`,
        }}
      >
        <Box className="zero-mark-spin-target" sx={{ display: "flex", lineHeight: 0 }}>
          <CodeZeroMark size={markSize * 0.88} />
        </Box>
      </Box>
    </Box>
  );
}
