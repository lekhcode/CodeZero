import type { ForumPostType } from "@/types/forum.types";
import { miui } from "@/theme/theme";

export const FORUM_POST_TYPE_META: Record<
  ForumPostType,
  { label: string; color: string; bg: string }
> = {
  DISCUSSION: { label: "Discussion", color: miui.text, bg: miui.accentSoft },
  QUESTION: { label: "Question", color: "#f5d76e", bg: "rgba(245,215,110,0.12)" },
  RESOURCE: { label: "Resource", color: "#7dd3a8", bg: "rgba(125,211,168,0.12)" },
  GUIDE: { label: "Guide", color: "#9ec5ff", bg: "rgba(158,197,255,0.12)" },
  INTERVIEW_EXPERIENCE: {
    label: "Interview",
    color: "#e8a87c",
    bg: "rgba(232,168,124,0.14)",
  },
};
