import { Box, Grid, Stack } from "@mui/material";

type LoadingSkeletonProps = {
  variant?: "cards" | "list" | "detail";
  count?: number;
};

export function LoadingSkeleton({ variant = "cards", count = 3 }: LoadingSkeletonProps) {
  if (variant === "detail") {
    return (
      <Stack spacing={2}>
        <Box className="skeleton skeleton-title" sx={{ width: "60%" }} />
        <Box className="skeleton skeleton-card" sx={{ height: 120 }} />
        <Box className="skeleton skeleton-card" sx={{ height: 280 }} />
      </Stack>
    );
  }

  if (variant === "list") {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: count }).map((_, i) => (
          <Box key={i} className="skeleton skeleton-card" sx={{ height: 72 }} />
        ))}
      </Stack>
    );
  }

  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <Box className="skeleton skeleton-card" sx={{ height: 180 }} />
        </Grid>
      ))}
    </Grid>
  );
}
