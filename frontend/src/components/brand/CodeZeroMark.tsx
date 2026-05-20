import { Box, type SxProps, type Theme } from "@mui/material";
import { miui } from "@/theme/theme";

type CodeZeroMarkProps = {
  size?: number;
  sx?: SxProps<Theme>;
};

/** `{0}` brand mark — orange zero on metal grey. */
export function CodeZeroMark({ size = 40, sx }: CodeZeroMarkProps) {
  const fontSize = Math.round(size * 0.52);
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontFamily: "ui-monospace, 'Fira Code', 'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.06em",
        userSelect: "none",
        ...sx,
      }}
    >
      <Box component="span" sx={{ color: miui.textMuted }}>
        {"{"}
      </Box>
      <Box component="span" sx={{ color: miui.brandOrange }}>
        0
      </Box>
      <Box component="span" sx={{ color: miui.textMuted }}>
        {"}"}
      </Box>
    </Box>
  );
}
