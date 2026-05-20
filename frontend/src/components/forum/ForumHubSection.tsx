import { Box, Button, Stack, Typography } from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Link } from "react-router-dom";
import type { ForumPostSummary } from "@/types/forum.types";
import { ForumPostCard } from "./ForumPostCard";
import { miui, sectionCardSx } from "@/theme/theme";

export function ForumHubSection({
  title,
  subtitle,
  posts,
  viewAllTo,
}: {
  title: string;
  subtitle?: string;
  posts: ForumPostSummary[];
  viewAllTo?: string;
}) {
  if (posts.length === 0) return null;

  return (
    <Box sx={{ ...sectionCardSx, mb: 2, overflow: "hidden" }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${miui.border}`,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: miui.text }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: miui.textMuted }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {viewAllTo && (
          <Button
            component={Link}
            to={viewAllTo}
            size="small"
            endIcon={<ChevronRightRoundedIcon />}
            sx={{ color: miui.textMuted, textTransform: "none" }}
          >
            View all
          </Button>
        )}
      </Stack>
      <Box
        className="app-scroll"
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          px: 2,
          py: 2,
          scrollSnapType: "x mandatory",
          "& > *": { scrollSnapAlign: "start", minWidth: { xs: 280, sm: 320 }, maxWidth: 360, flex: "0 0 auto" },
        }}
      >
        {posts.map((post) => (
          <ForumPostCard key={post.id} post={post} compact />
        ))}
      </Box>
    </Box>
  );
}
