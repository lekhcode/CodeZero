import { Box, type SxProps, type Theme } from "@mui/material";

type CodeZeroMarkProps = {
  size?: number;
  sx?: SxProps<Theme>;
};

/** `{0}` — PNG; screen blend on the orange chip drops the black plate. */
export function CodeZeroMark({ size = 40, sx }: CodeZeroMarkProps) {
  return (
    <Box
      component="img"
      src="/codezero-mark.png"
      alt=""
      draggable={false}
      sx={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
        mixBlendMode: "screen",
        userSelect: "none",
        ...sx,
      }}
    />
  );
}
