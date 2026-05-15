import { Box, type BoxProps } from "@mui/material";
import type { ReactNode } from "react";
import { MotionFadeIn } from "./MotionFadeIn";

type PageContainerProps = BoxProps & {
  children: ReactNode;
};

/** Consistent page padding + entrance animation for route-level content. */
export function PageContainer({ children, sx, ...props }: PageContainerProps) {
  return (
    <MotionFadeIn>
      <Box
        sx={{
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
  );
}
