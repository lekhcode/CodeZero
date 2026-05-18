import { useCallback, useEffect, useRef } from "react";
import { Alert, Box, CircularProgress, Typography, alpha } from "@mui/material";
import { ProblemCatalogVirtualTable } from "@/components/problems/ProblemCatalogVirtualTable";
import { ProblemCatalogStaticTable } from "@/components/problems/ProblemCatalogStaticTable";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useProblemCatalogInfinite,
  type CatalogFilterState,
} from "@/hooks/useProblemCatalogInfinite";
import { miui } from "@/theme/theme";

type ProblemCatalogInfiniteListProps = {
  filters: CatalogFilterState;
  pageSize?: number;
  compact?: boolean;
  maxHeight?: number | string;
  /** Dashboard preview: render all rows without virtualizer (avoids blank-until-scroll). */
  virtualized?: boolean;
  /** When false, only the first page is fetched (no scroll-to-load). */
  enableLoadMore?: boolean;
};

const DEFAULT_LAB_HEIGHT = "min(72vh, 720px)";

export function ProblemCatalogInfiniteList({
  filters,
  pageSize = 50,
  compact = false,
  maxHeight = DEFAULT_LAB_HEIGHT,
  virtualized = true,
  enableLoadMore = true,
}: ProblemCatalogInfiniteListProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    items,
    total,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProblemCatalogInfinite(filters, pageSize);

  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  const loadMore = useCallback(() => {
    if (!enableLoadMore) {
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPageRef.current();
    }
  }, [enableLoadMore, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!enableLoadMore) {
      return;
    }
    const sentinel = sentinelRef.current;
    const root = scrollRootRef.current;
    if (sentinel === null || root === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root, rootMargin: "120px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enableLoadMore, loadMore, items.length, hasNextPage]);

  if (isLoading && items.length === 0) {
    return <LoadingSkeleton variant="list" count={compact ? 6 : 10} />;
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error instanceof Error ? error.message : "Failed to load problems"}
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No problems match"
        description="Try clearing filters or sync the catalog from the backend."
      />
    );
  }

  const table = virtualized ? (
    <ProblemCatalogVirtualTable items={items} compact={compact} scrollRef={scrollRootRef} />
  ) : (
    <ProblemCatalogStaticTable items={items} compact={compact} />
  );

  return (
    <Box
      ref={scrollRootRef}
      sx={{
        maxHeight,
        minHeight: compact ? 280 : 400,
        overflowY: "auto",
        overflowX: "hidden",
        borderRadius: 2,
        bgcolor: alpha(miui.bg, 0.35),
        border: `1px solid ${miui.border}`,
        WebkitOverflowScrolling: "touch",
        "&::-webkit-scrollbar": { width: 8 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: alpha(miui.text, 0.15),
          borderRadius: 4,
        },
      }}
    >
      {table}

      {enableLoadMore && (
        <>
          <Box ref={sentinelRef} sx={{ height: 8, width: "100%" }} aria-hidden />

          {isFetchingNextPage && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                py: 2,
              }}
            >
              <CircularProgress size={22} thickness={5} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Loading more…
              </Typography>
            </Box>
          )}

          {!hasNextPage && !isFetchingNextPage && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center", py: 2, fontWeight: 600 }}
            >
              {items.length >= total
                ? `All ${total.toLocaleString()} problems loaded`
                : "End of list"}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
