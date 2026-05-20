import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link as RouterLink } from "react-router-dom";
import type { ForumPostSummary } from "@/types/forum.types";
import { ForumPostTypeBadge } from "./ForumPostTypeBadge";
import { miui, monoStatSx } from "@/theme/theme";

dayjs.extend(relativeTime);

function authorLabel(author: ForumPostSummary["author"]): string {
  return author.name ?? author.email.split("@")[0] ?? "Member";
}

function authorInitial(author: ForumPostSummary["author"]): string {
  const label = authorLabel(author);
  return label.charAt(0).toUpperCase();
}

export function ForumPostCard({ post, compact = false }: { post: ForumPostSummary; compact?: boolean }) {
  return (
    <Card
      className="card-hover"
      sx={{
        bgcolor: miui.paper,
        border: `1px solid ${miui.border}`,
        borderRadius: 2.5,
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: miui.borderStrong,
          transform: "translateY(-2px)",
          boxShadow: miui.shadowMd,
        },
      }}
    >
      <CardActionArea component={RouterLink} to={`/community/posts/${post.id}`} sx={{ borderRadius: 2.5 }}>
        <CardContent sx={{ p: compact ? 1.75 : 2.25 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: miui.elevated,
                border: `1px solid ${miui.borderStrong}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: miui.textMuted,
                flexShrink: 0,
              }}
            >
              {authorInitial(post.author)}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.75 }}>
                <ForumPostTypeBadge type={post.type} />
                <Typography variant="caption" sx={{ color: miui.textDim }}>
                  {authorLabel(post.author)} · {dayjs(post.createdAt).fromNow()}
                </Typography>
              </Stack>
              <Typography
                variant={compact ? "subtitle2" : "subtitle1"}
                sx={{ fontWeight: 700, color: miui.text, mb: 0.75, lineHeight: 1.35 }}
              >
                {post.title}
              </Typography>
              {!compact && (
                <Typography
                  variant="body2"
                  sx={{
                    color: miui.textMuted,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    mb: 1,
                    lineHeight: 1.55,
                  }}
                >
                  {post.contentPreview}
                </Typography>
              )}
              {post.externalLink && post.linkHost && (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 1 }}>
                  <LinkRoundedIcon sx={{ fontSize: 14, color: miui.info }} />
                  <Typography variant="caption" sx={{ color: miui.info }}>
                    {post.linkHost}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <FavoriteBorderRoundedIcon sx={{ fontSize: 16, color: miui.textDim }} />
                  <Typography variant="caption" sx={{ ...monoStatSx, color: miui.textMuted }}>
                    {post.likeCount}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16, color: miui.textDim }} />
                  <Typography variant="caption" sx={{ ...monoStatSx, color: miui.textMuted }}>
                    {post.commentCount}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
      {post.externalLink && !compact && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Link
            href={post.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            variant="caption"
            sx={{ color: miui.info }}
          >
            Open resource
          </Link>
        </Box>
      )}
    </Card>
  );
}
