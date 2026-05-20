import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ForumComment } from "@/types/forum.types";
import { forumService } from "@/services/forum.service";
import { queryKeys } from "@/hooks/queryKeys";
import { ForumEmojiPickerButton } from "./ForumEmojiPickerButton";
import { insertAtCursor } from "./forumComposerUtils";
import { miui, monoStatSx } from "@/theme/theme";

dayjs.extend(relativeTime);

function authorLabel(author: ForumComment["author"]): string {
  return author.name ?? author.email.split("@")[0] ?? "Member";
}

type CommentNode = ForumComment & { children: CommentNode[] };

function buildTree(comments: ForumComment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of comments) {
    byId.set(c.id, { ...c, children: [] });
  }
  for (const c of comments) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function CommentRow({
  node,
  depth,
  postId,
  onReply,
}: {
  node: CommentNode;
  depth: number;
  postId: string;
  onReply: (parentId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(node.likedByMe);
  const [likeCount, setLikeCount] = useState(node.likeCount);

  const likeMutation = useMutation({
    mutationFn: () => forumService.toggleCommentLike(node.id),
    onSuccess: (result) => {
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumComments(postId) });
    },
  });

  return (
    <Box
      sx={{
        pl: depth > 0 ? 2 : 0,
        ml: depth > 0 ? 1.5 : 0,
        borderLeft: depth > 0 ? `2px solid ${miui.borderMid}` : "none",
        py: 1.25,
        borderBottom: `1px solid ${miui.border}`,
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 0,
            bgcolor: miui.elevated,
            border: `1px solid ${miui.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: miui.textMuted,
            flexShrink: 0,
          }}
        >
          {authorLabel(node.author).charAt(0).toUpperCase()}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: miui.textDim, display: "block", mb: 0.35 }}>
            <Box component="span" sx={{ color: miui.text, fontWeight: 600 }}>
              {authorLabel(node.author)}
            </Box>
            {" · "}
            {dayjs(node.createdAt).fromNow()}
          </Typography>
          <Typography variant="body2" sx={{ color: miui.textMuted, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
            {node.content}
          </Typography>
          <Stack direction="row" spacing={0.25} sx={{ mt: 0.5, alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              aria-label="Like comment"
              sx={{ borderRadius: 0 }}
            >
              {liked ? (
                <FavoriteRoundedIcon sx={{ fontSize: 16, color: "#f87171" }} />
              ) : (
                <FavoriteBorderRoundedIcon sx={{ fontSize: 16, color: miui.textDim }} />
              )}
            </IconButton>
            <Typography variant="caption" sx={{ ...monoStatSx, color: miui.textDim, mr: 0.5 }}>
              {likeCount}
            </Typography>
            <Button
              size="small"
              startIcon={<ReplyRoundedIcon sx={{ fontSize: 14 }} />}
              onClick={() => onReply(node.id)}
              sx={{
                textTransform: "none",
                color: miui.textMuted,
                minWidth: 0,
                borderRadius: 0,
                fontSize: "0.75rem",
              }}
            >
              Reply
            </Button>
          </Stack>
          {node.children.map((child) => (
            <Box key={child.id} sx={{ mt: 0.5 }}>
              <CommentRow node={child} depth={depth + 1} postId={postId} onReply={onReply} />
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

export function ForumCommentThread({
  postId,
  comments,
  fieldSx,
}: {
  postId: string;
  comments: ForumComment[];
  fieldSx?: SxProps<Theme>;
}) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const tree = useMemo(() => buildTree(comments), [comments]);

  const createMutation = useMutation({
    mutationFn: () =>
      forumService.createComment(postId, content.trim(), replyParentId ?? undefined),
    onSuccess: () => {
      setContent("");
      setReplyParentId(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumComments(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumPost(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumHub });
    },
  });

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (el) {
      setContent(insertAtCursor(el, emoji, content));
    } else {
      setContent((c) => c + emoji);
    }
  };

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: miui.textDim,
          mb: 1.5,
        }}
      >
        Discussion · {comments.length}
      </Typography>

      {tree.length === 0 ? (
        <Typography variant="body2" sx={{ color: miui.textGhost, mb: 2, fontSize: "0.8125rem" }}>
          No comments yet. Start the conversation.
        </Typography>
      ) : (
        <Box sx={{ mb: 2 }}>
          {tree.map((node) => (
            <CommentRow
              key={node.id}
              node={node}
              depth={0}
              postId={postId}
              onReply={(id) => setReplyParentId(id)}
            />
          ))}
        </Box>
      )}

      <Box
        sx={{
          border: `1px solid ${miui.border}`,
          bgcolor: miui.elevated,
          borderRadius: 0,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        {replyParentId && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ color: miui.accent, fontSize: "0.75rem" }}>
              Replying to a comment
            </Typography>
            <Button
              size="small"
              onClick={() => setReplyParentId(null)}
              sx={{ minWidth: 0, p: 0, borderRadius: 0, textTransform: "none", fontSize: "0.75rem" }}
            >
              Cancel
            </Button>
          </Stack>
        )}

        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="Share your insight, hint, or experience…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          inputRef={inputRef}
          sx={{ mb: 1.25, ...fieldSx }}
        />

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <ForumEmojiPickerButton onPick={insertEmoji} disabled={createMutation.isPending} />
          <Button
            variant="contained"
            disabled={content.trim().length < 2 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            sx={{
              borderRadius: 0,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              bgcolor: miui.ctaBg,
              color: miui.ctaText,
              boxShadow: "none",
              "&:hover": { bgcolor: miui.ctaHover, boxShadow: "none" },
            }}
          >
            {createMutation.isPending ? "Posting…" : "Post comment"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
