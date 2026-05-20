import { Box, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link as RouterLink } from "react-router-dom";
import type { ForumPostSummary } from "@/types/forum.types";
import { ForumAuthorAvatar } from "./ForumAuthorAvatar";
import { authorDisplayName, authorHandle } from "@/utils/forumAuthor";
import { FORUM_POST_TYPE_META } from "@/utils/forumLabels";
import { miui, monoStatSx } from "@/theme/theme";

dayjs.extend(relativeTime);

export function ForumFeedPost({ post, index = 0 }: { post: ForumPostSummary; index?: number }) {
  const typeMeta = FORUM_POST_TYPE_META[post.type];
  const name = authorDisplayName(post.author.name, post.author.email);
  const handle = authorHandle(post.author.username);
  const stripe = index % 2 === 1;

  return (
    <Box
      component={RouterLink}
      to={`/community/posts/${post.id}`}
      sx={{
        display: "block",
        py: 1.35,
        pl: 1.25,
        pr: 0.5,
        textDecoration: "none",
        color: "inherit",
        borderBottom: `1px solid ${miui.border}`,
        borderLeft: `2px solid ${typeMeta.color}`,
        bgcolor: stripe ? "var(--walnut-soft)" : "transparent",
        transition: "background 120ms ease",
        "&:hover": {
          bgcolor: miui.hover,
          "& .forum-feed-title": { color: miui.text },
        },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", mb: 0.65 }}>
        <ForumAuthorAvatar
          authorId={post.author.id}
          name={post.author.name}
          email={post.author.email}
          size={26}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="span"
                sx={{ fontWeight: 700, fontSize: "0.75rem", color: miui.text, lineHeight: 1.3, display: "block" }}
              >
                {name}
              </Typography>
              {handle && (
                <Typography component="span" sx={{ fontSize: "0.625rem", color: miui.textDim, display: "block" }}>
                  {handle}
                </Typography>
              )}
            </Box>
            <Typography
              component="span"
              sx={{
                fontSize: "0.625rem",
                fontWeight: 600,
                color: typeMeta.color,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {typeMeta.label}
            </Typography>
            <Typography component="span" sx={{ fontSize: "0.625rem", color: miui.textDim }}>
              {dayjs(post.createdAt).fromNow()}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Typography
        className="forum-feed-title"
        sx={{
          fontWeight: 700,
          fontSize: "0.8125rem",
          color: miui.textMuted,
          lineHeight: 1.35,
          mb: 0.5,
          pl: 0.25,
          transition: "color 150ms ease",
        }}
      >
        {post.title}
      </Typography>

      <Typography
        sx={{
          color: miui.textDim,
          whiteSpace: "pre-wrap",
          lineHeight: 1.55,
          mb: post.externalLink ? 0.5 : 0.65,
          fontSize: "0.75rem",
          pl: 0.25,
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {post.contentPreview}
      </Typography>

      {post.externalLink && post.linkHost && (
        <Typography
          sx={{
            color: miui.info,
            fontSize: "0.6875rem",
            display: "block",
            mb: 0.5,
            pl: 0.25,
            opacity: 0.85,
          }}
        >
          ↗ {post.linkHost}
        </Typography>
      )}

      <Typography sx={{ ...monoStatSx, color: miui.textDim, fontSize: "0.6875rem", pl: 0.25 }}>
        {post.likeCount} likes · {post.commentCount} comments
      </Typography>
    </Box>
  );
}
