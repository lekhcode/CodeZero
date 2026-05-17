import { Box, type BoxProps } from "@mui/material";
import type { ReactNode } from "react";
import { MotionFadeIn } from "./MotionFadeIn";

type PageContainerProps = BoxProps & {
  children: ReactNode;
  /** No page scroll — parent must be FixedPageShell or flex outlet with overflow hidden. */
  fixed?: boolean;
};

/** Page padding; scrollable by default inside the app shell. */
export function PageContainer({ children, fixed = false, sx, ...props }: PageContainerProps) {
  if (fixed) {
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
          py: { xs: 2, sm: 2.5 },
          maxWidth: "100%",
          width: "100%",
          ...sx,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <MotionFadeIn>
        <Box
          sx={{
            height: "100%",
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            maxWidth: 1280,
            mx: "auto",
            width: "100%",
            ...sx,
          }}
          {...props}
        >
          {children}
        </Box>
      </MotionFadeIn>
    </Box>
  );
}
