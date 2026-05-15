import type { ScheduleType } from "@/types/api.types";

export type TemplateCatalogMeta = {
  tagline: string;
  highlights: string[];
  problemCount?: number;
  badge?: string;
  gradient: [string, string];
};

const CATALOG: Record<string, TemplateCatalogMeta> = {
  "daily-potd": {
    tagline: "LeetCode’s official daily challenge — same problem for everyone, fresh every 24h.",
    highlights: ["1 curated problem per day", "Build interview consistency", "Auto-synced from LeetCode"],
    badge: "Recommended",
    gradient: ["#0ea5e9", "#38bdf8"],
  },
  "blind-75": {
    tagline: "The iconic 75-question list for FAANG-style interviews.",
    highlights: ["75 hand-picked problems", "2 problems/day default", "Arrays → graphs → DP"],
    problemCount: 75,
    badge: "Classic",
    gradient: ["#4f46e5", "#7c3aed"],
  },
  "top-interview-150": {
    tagline: "LeetCode’s must-do list for technical interview prep.",
    highlights: ["150 ordered problems", "Broad pattern coverage", "Interview-focused"],
    problemCount: 150,
    badge: "Complete",
    gradient: ["#6366f1", "#0ea5e9"],
  },
  "neetcode-150": {
    tagline: "NeetCode’s curated roadmap (coming soon to CodeZero).",
    highlights: ["Video-aligned list", "Pattern-based", "Expandable later"],
    problemCount: 150,
    gradient: ["#8b5cf6", "#a78bfa"],
  },
  "binary-search": {
    tagline: "Master sorted arrays, boundaries, and search space.",
    highlights: ["Topic-focused pool", "Custom difficulty", "1–5 problems/day"],
    gradient: ["#059669", "#34d399"],
  },
  "dynamic-programming": {
    tagline: "Tabulation, memoization, and classic DP patterns.",
    highlights: ["Topic-focused pool", "Step-by-step growth", "Interview staples"],
    gradient: ["#d97706", "#fbbf24"],
  },
  graphs: {
    tagline: "BFS, DFS, topological sort, and union-find.",
    highlights: ["Topic-focused pool", "Visual thinking", "High-yield patterns"],
    gradient: ["#0284c7", "#22d3ee"],
  },
  "sliding-window": {
    tagline: "Two pointers and fixed/variable windows.",
    highlights: ["Topic-focused pool", "Fast wins", "Array & string focus"],
    gradient: ["#db2777", "#f472b6"],
  },
};

const TYPE_LABEL: Record<ScheduleType, string> = {
  DAILY_POTD: "Daily challenge",
  STUDY_PLAN: "Study plan",
  TOPIC: "Topic track",
};

export function getTemplateMeta(slug: string, _type?: ScheduleType): TemplateCatalogMeta {
  return (
    CATALOG[slug] ?? {
      tagline: "Structured practice on your schedule.",
      highlights: ["Flexible daily count", "Track progress in dashboard"],
      gradient: ["#64748b", "#94a3b8"],
    }
  );
}

export function getTypeLabel(type: ScheduleType): string {
  return TYPE_LABEL[type];
}

export const EXPLORE_SECTION_ORDER: ScheduleType[] = ["DAILY_POTD", "STUDY_PLAN", "TOPIC"];

export const EXPLORE_SECTION_TITLES: Record<ScheduleType, { title: string; subtitle: string }> = {
  DAILY_POTD: {
    title: "Daily challenge",
    subtitle: "Stay consistent with one official LeetCode problem every day.",
  },
  STUDY_PLAN: {
    title: "Study plans",
    subtitle: "Follow a proven list — we assign the next problems in order each day.",
  },
  TOPIC: {
    title: "Topic practice",
    subtitle: "Focus on one pattern at a time with customizable difficulty.",
  },
};
