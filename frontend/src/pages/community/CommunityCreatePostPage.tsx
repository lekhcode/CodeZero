import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FixedPageShell } from "@/components/layout/FixedPageShell";
import type { ForumPostType } from "@/types/forum.types";
import { forumService } from "@/services/forum.service";
import { FORUM_POST_TYPE_META } from "@/utils/forumLabels";
import { glassSx, miui, sectionCardSx } from "@/theme/theme";

const TYPES = Object.keys(FORUM_POST_TYPE_META) as ForumPostType[];

export function CommunityCreatePostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [type, setType] = useState<ForumPostType>("DISCUSSION");

  const createMutation = useMutation({
    mutationFn: () =>
      forumService.createPost({
        title: title.trim(),
        content: content.trim(),
        type,
        ...(externalLink.trim() ? { externalLink: externalLink.trim() } : {}),
      }),
    onSuccess: (post) => {
      navigate(`/community/posts/${post.id}`);
    },
  });

  return (
    <FixedPageShell sx={{ bgcolor: miui.bg, maxWidth: 720, mx: "auto", width: "100%" }}>
      <Button
        component={RouterLink}
        to="/community"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start", mb: 2, color: miui.textMuted, textTransform: "none" }}
      >
        Back to hub
      </Button>

      <Box sx={{ ...sectionCardSx, ...glassSx, p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h5"
          sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, color: miui.text, mb: 0.5 }}
        >
          Create post
        </Typography>
        <Typography variant="body2" sx={{ color: miui.textMuted, mb: 3 }}>
          Text & links only — share knowledge, questions, or interview experiences.
        </Typography>

        <Stack spacing={2.25} component="form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
          <TextField
            select
            label="Post type"
            value={type}
            onChange={(e) => setType(e.target.value as ForumPostType)}
            fullWidth
          >
            {TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {FORUM_POST_TYPE_META[t].label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            required
            multiline
            minRows={8}
            placeholder="Explain your approach, share your experience, or ask a clear question…"
          />

          <TextField
            label="External link (optional)"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            fullWidth
            placeholder="https://neetcode.io/roadmap"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={
              title.trim().length < 4 ||
              content.trim().length < 8 ||
              createMutation.isPending
            }
          >
            {createMutation.isPending ? "Publishing…" : "Publish"}
          </Button>
        </Stack>
      </Box>
    </FixedPageShell>
  );
}
