import { Box, Button, Typography } from "@mui/material";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FixedPageShell } from "@/components/layout/FixedPageShell";
import { ForumFeedPost } from "@/components/forum/ForumFeedPost";
import { ForumHeadlineSection } from "@/components/forum/ForumHeadlineSection";
import { ForumPostComposer } from "@/components/forum/ForumPostComposer";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { queryKeys } from "@/hooks/queryKeys";
import { forumService } from "@/services/forum.service";
import { FORUM_POST_TYPE_META } from "@/utils/forumLabels";
import { miui } from "@/theme/theme";
import "@/styles/community.css";

const SIDEBAR_WIDTH = 248;

export function CommunityHubPage() {
  const hubQuery = useQuery({
    queryKey: queryKeys.forumHub,
    queryFn: forumService.getHubFeed,
  });

  const feedQuery = useInfiniteQuery({
    queryKey: queryKeys.forumPosts({ sort: "latest", hub: true }),
    queryFn: ({ pageParam }) =>
      forumService.listPosts({
        cursor: pageParam as string | undefined,
        limit: 15,
        sort: "latest",
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
  });

  const feed = hubQuery.data;
  const allRecent = feedQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <FixedPageShell
      sx={{
        bgcolor: miui.bg,
        px: { xs: 1.5, sm: 2 },
        py: { xs: 0.75, sm: 1 },
        fontSize: "0.8125rem",
      }}
    >
      <Box className="community-hub" sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Typography
        sx={{
          flexShrink: 0,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 800,
          fontSize: "0.9rem",
          color: miui.text,
          mb: 0.5,
          pb: 0.5,
          borderBottom: `1px solid ${miui.border}`,
        }}
      >
        Community
      </Typography>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: { xs: "flex", lg: "grid" },
          flexDirection: { xs: "column" },
          gridTemplateColumns: { lg: `minmax(0, 640px) ${SIDEBAR_WIDTH}px` },
          gridTemplateRows: { lg: "auto 1fr" },
          columnGap: { lg: 2 },
          rowGap: 0,
          width: { lg: "fit-content" },
          maxWidth: "100%",
        }}
      >
        <Box sx={{ gridColumn: { lg: "1 / -1" }, flexShrink: 0, mb: 0.5 }}>
          <ForumPostComposer compact />
        </Box>

        <Box
          sx={{
            flex: { xs: 1 },
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            order: { xs: 2, lg: 0 },
          }}
        >
          <Typography
            sx={{
              flexShrink: 0,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: miui.textDim,
              mb: 0.65,
              fontSize: "0.6rem",
            }}
          >
            All recent
          </Typography>

          <Box className="app-scroll" sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
            {feedQuery.isLoading && <LoadingSkeleton count={5} />}

            {allRecent.map((post, index) => (
              <ForumFeedPost key={post.id} post={post} index={index} />
            ))}

            {feedQuery.hasNextPage && (
              <Box sx={{ py: 1.25, textAlign: "center" }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => void feedQuery.fetchNextPage()}
                  disabled={feedQuery.isFetchingNextPage}
                  sx={{ color: miui.textDim, textTransform: "none", fontSize: "0.75rem", minHeight: 28 }}
                >
                  {feedQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            width: { xs: "100%" },
            minHeight: { xs: 280, lg: 0 },
            maxHeight: { xs: 300, lg: "none" },
            height: { lg: "100%" },
            display: "flex",
            flexDirection: "column",
            order: { xs: 1, lg: 0 },
            borderLeft: { lg: `1px solid ${miui.border}` },
            borderBottom: { xs: `1px solid ${miui.border}`, lg: "none" },
            pl: { lg: 1.5 },
            pb: { xs: 0.75, lg: 0 },
            mb: { xs: 0.75, lg: 0 },
          }}
        >
          {hubQuery.isLoading && <LoadingSkeleton count={2} />}

          {feed && (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "grid",
                gridTemplateRows: "repeat(4, 1fr)",
                height: "100%",
              }}
            >
              <ForumHeadlineSection
                title="Trending"
                posts={feed.trending}
                accentColor={FORUM_POST_TYPE_META.DISCUSSION.color}
              />
              <ForumHeadlineSection
                title="Latest"
                posts={feed.latest}
                accentColor={FORUM_POST_TYPE_META.QUESTION.color}
              />
              <ForumHeadlineSection
                title="Resources"
                posts={feed.resources}
                accentColor={FORUM_POST_TYPE_META.RESOURCE.color}
              />
              <ForumHeadlineSection
                title="Interviews"
                posts={feed.interviewExperiences}
                accentColor={FORUM_POST_TYPE_META.INTERVIEW_EXPERIENCE.color}
              />
            </Box>
          )}
        </Box>
      </Box>
      </Box>
    </FixedPageShell>
  );
}
