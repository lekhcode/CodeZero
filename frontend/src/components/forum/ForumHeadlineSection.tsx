import { Box, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import type { ForumPostSummary } from "@/types/forum.types";
import { authorAccentColor, authorDisplayName, authorHandle } from "@/utils/forumAuthor";
import { miui, monoStatSx } from "@/theme/theme";

export function ForumHeadlineSection({
  title,
  posts,
  accentColor,
}: {
  title: string;
  posts: ForumPostSummary[];
  accentColor?: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderBottom: `1px solid ${miui.border}`,
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Typography
        sx={{
          flexShrink: 0,
          px: 1,
          py: 0.65,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: accentColor ?? miui.textDim,
          fontSize: "0.6rem",
          borderLeft: accentColor ? `2px solid ${accentColor}` : "none",
          pl: accentColor ? 1 : 1,
        }}
      >
        {title}
      </Typography>
      <Box className="app-scroll" sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {posts.length === 0 ? (
          <Typography sx={{ px: 1, pb: 0.75, color: miui.textDim, fontSize: "0.6875rem" }}>
            Nothing yet
          </Typography>
        ) : (
          posts.map((post) => {
            const dot = authorAccentColor(post.author.id);
            const name = authorDisplayName(post.author.name, post.author.email);
            const handle = authorHandle(post.author.username);
            return (
              <Box
                key={post.id}
                component={Link}
                to={`/community/posts/${post.id}`}
                sx={{
                  display: "block",
                  px: 1,
                  py: 0.6,
                  textDecoration: "none",
                  borderTop: `1px solid ${miui.border}`,
                  color: "inherit",
                  "&:hover": { bgcolor: miui.hover },
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start", mb: 0.25 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      mt: "0.35rem",
                      flexShrink: 0,
                      bgcolor: dot,
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        color: miui.text,
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        color: miui.textDim,
                        mt: 0.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                      {handle ? ` · ${handle}` : ""}
                    </Typography>
                    <Typography sx={{ ...monoStatSx, color: miui.textDim, fontSize: "0.6rem", mt: 0.15 }}>
                      {post.likeCount} likes · {post.commentCount} comments
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
