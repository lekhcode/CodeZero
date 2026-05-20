import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FixedPageShell, ScrollRegion } from "@/components/layout/FixedPageShell";
import { LabSection } from "@/components/learning/LabSection";
import { ProblemCatalogFilters } from "@/components/problems/ProblemCatalogFilters";
import { ProblemCatalogInfiniteList } from "@/components/problems/ProblemCatalogInfiniteList";
import { ProblemCatalogStatsBar } from "@/components/problems/ProblemCatalogStatsBar";
import { ProblemTopicTagBar } from "@/components/problems/ProblemTopicTagBar";
import { problemsService } from "@/services/problems.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { CatalogFilterState } from "@/hooks/useProblemCatalogInfinite";
import type { DifficultyLevel } from "@/types/api.types";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { miui, monoStatSx } from "@/theme/theme";
import { transitionFast } from "@/theme/motion";

const PAGE_SIZE = 50;

export function LabPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [includePremium, setIncludePremium] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const catalogFilters: CatalogFilterState = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      difficulty: difficulty.length > 0 ? difficulty : undefined,
      topics: topics.length > 0 ? topics : undefined,
      includePremium,
    }),
    [debouncedSearch, difficulty, topics, includePremium],
  );

  const statsQuery = useQuery({
    queryKey: queryKeys.problemCatalogStats(includePremium),
    queryFn: () => problemsService.getCatalogStats(includePremium),
    staleTime: 60_000,
  });

  const topicsQuery = useQuery({
    queryKey: queryKeys.problemTopics(includePremium),
    queryFn: () => problemsService.listTopicTags(includePremium),
    staleTime: 5 * 60_000,
  });

  const filteredTotalQuery = useQuery({
    queryKey: queryKeys.problemCatalog({ ...catalogFilters, totalOnly: true }),
    queryFn: () => problemsService.list({ ...catalogFilters, page: 1, limit: 1 }),
    staleTime: 15_000,
  });

  const toggleTopic = useCallback((topic: string) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }, []);

  const [listStats, setListStats] = useState<{ total: number; solvedCount?: number }>({
    total: 0,
  });

  const solvedLabel =
    listStats.solvedCount !== undefined && listStats.total > 0 ? (
      <Typography
        sx={{
          ...monoStatSx,
          fontSize: "12px",
          fontWeight: 500,
          color: miui.textMuted,
          whiteSpace: "nowrap",
        }}
      >
        <Box component="span" sx={{ color: miui.success }}>
          <AnimatedNumber value={listStats.solvedCount} />
        </Box>
        {" / "}
        <AnimatedNumber value={listStats.total} duration={500} /> solved
      </Typography>
    ) : null;

  return (
    <FixedPageShell>
      <Box sx={{ flexShrink: 0, mb: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Problem library
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Search, filter, and solve from the full catalog
        </Typography>
      </Box>

      <ScrollRegion sx={{ pb: 0.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <ProblemCatalogStatsBar
            stats={statsQuery.data}
            loading={statsQuery.isLoading}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            filteredTotal={filteredTotalQuery.data?.total}
          />

          <ProblemCatalogFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            includePremium={includePremium}
            onIncludePremiumChange={setIncludePremium}
          />

          <Box
            sx={{
              px: 0.5,
              py: 1,
              borderTop: `1px solid ${miui.border}`,
              borderBottom: `1px solid ${miui.border}`,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", mb: 1, display: "block" }}
            >
              Topics
            </Typography>
            <ProblemTopicTagBar
              topicTags={topicsQuery.data?.topicTags ?? []}
              selected={topics}
              onToggle={toggleTopic}
              loading={topicsQuery.isLoading}
            />
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionFast}
          >
            <LabSection title="Problems" action={solvedLabel}>
              <ProblemCatalogInfiniteList
                filters={catalogFilters}
                pageSize={PAGE_SIZE}
                onListStats={setListStats}
              />
            </LabSection>
          </motion.div>
        </Box>
      </ScrollRegion>
    </FixedPageShell>
  );
}
