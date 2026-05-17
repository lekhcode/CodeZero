import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

/** Fills the main outlet without page-level scroll (inner regions scroll instead). */
export function FixedPageShell({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        width: "100%",
        maxWidth: "100%",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** Scrollable sub-region inside a fixed page shell. */
export function ScrollRegion({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
