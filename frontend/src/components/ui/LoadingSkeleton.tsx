import { Grid, Skeleton, Stack } from "@mui/material";

type LoadingSkeletonProps = {
  variant?: "cards" | "list" | "detail";
  count?: number;
};

export function LoadingSkeleton({ variant = "cards", count = 3 }: LoadingSkeletonProps) {
  if (variant === "detail") {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={280} />
      </Stack>
    );
  }

  if (variant === "list") {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  }

  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <Skeleton variant="rounded" height={180} />
        </Grid>
      ))}
    </Grid>
  );
}
