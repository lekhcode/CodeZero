/** Summary row for a problem inside a study plan list (no full statement). */
export type PlanProblemSummary = {
  order: number;
  slug: string;
  title: string;
  difficulty: string;
  topics: string[];
  isPremium: boolean;
  hasDetail: boolean;
};

export type PlanProblemsResponse = {
  templateSlug: string;
  templateName: string;
  total: number;
  problems: PlanProblemSummary[];
};
