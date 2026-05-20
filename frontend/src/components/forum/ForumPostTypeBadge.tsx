import { Chip } from "@mui/material";
import type { ForumPostType } from "@/types/forum.types";
import { FORUM_POST_TYPE_META } from "@/utils/forumLabels";

export function ForumPostTypeBadge({
  type,
  size = "small",
  square = false,
}: {
  type: ForumPostType;
  size?: "small" | "medium";
  square?: boolean;
}) {
  const meta = FORUM_POST_TYPE_META[type];
  return (
    <Chip
      label={meta.label}
      size={size}
      sx={{
        height: size === "small" ? 22 : 26,
        borderRadius: square ? 0 : undefined,
        fontWeight: 600,
        fontSize: "0.6875rem",
        letterSpacing: "0.02em",
        color: meta.color,
        bgcolor: meta.bg,
        border: `1px solid ${meta.bg}`,
      }}
    />
  );
}
