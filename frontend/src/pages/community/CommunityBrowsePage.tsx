import { Box, Button, Stack, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { FixedPageShell, ScrollRegion } from "@/components/layout/FixedPageShell";
import { ForumPostCard } from "@/components/forum/ForumPostCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { forumService } from "@/services/forum.service";
import type { ForumPostType } from "@/types/forum.types";
import { FORUM_POST_TYPE_META } from "@/utils/forumLabels";
import { miui } from "@/theme/theme";

const VALID_TYPES = new Set<string>(Object.keys(FORUM_POST_TYPE_META));

export function CommunityBrowsePage() {
  const [params] = useSearchParams();
  const typeParam = params.get("type");
  const sortParam = params.get("sort") === "trending" ? "trending" : "latest";
  const type =
    typeParam !== null && VALID_TYPES.has(typeParam) ? (typeParam as ForumPostType) : undefined;

  const feedQuery = useInfiniteQuery({
    queryKey: ["forum", "browse", type, sortParam],
    queryFn: ({ pageParam }) =>
      forumService.listPosts({
        cursor: pageParam as string | undefined,
        limit: 15,
        type,
        sort: sortParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
  });

  const items = feedQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const title =
    type !== undefined
      ? FORUM_POST_TYPE_META[type].label
      : sortParam === "trending"
        ? "Trending"
        : "All posts";

  return (
    <FixedPageShell sx={{ bgcolor: miui.bg }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: miui.text }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: miui.textMuted }}>
            {sortParam === "trending" ? "Most engaged recently" : "Latest first"}
          </Typography>
        </Box>
        <Button component={Link} to="/community" sx={{ textTransform: "none", color: miui.textMuted }}>
          Hub
        </Button>
      </Stack>

      <ScrollRegion>
        {feedQuery.isLoading && <LoadingSkeleton count={4} />}
        <Stack spacing={1.5}>
          {items.map((post) => (
            <ForumPostCard key={post.id} post={post} />
          ))}
        </Stack>
        {feedQuery.hasNextPage && (
          <Box sx={{ py: 2, textAlign: "center" }}>
            <Button
              variant="outlined"
              onClick={() => void feedQuery.fetchNextPage()}
              disabled={feedQuery.isFetchingNextPage}
            >
              {feedQuery.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </Box>
        )}
      </ScrollRegion>
    </FixedPageShell>
  );
}
