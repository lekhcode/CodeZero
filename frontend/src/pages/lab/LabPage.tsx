import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/ui/PageContainer";
import { LabSection } from "@/components/learning/LabSection";
import { ProblemCatalogFilters } from "@/components/problems/ProblemCatalogFilters";
import { ProblemCatalogInfiniteList } from "@/components/problems/ProblemCatalogInfiniteList";
import { ProblemCatalogStatsBar } from "@/components/problems/ProblemCatalogStatsBar";
import { ProblemTopicTagBar } from "@/components/problems/ProblemTopicTagBar";
import { problemsService } from "@/services/problems.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { CatalogFilterState } from "@/hooks/useProblemCatalogInfinite";
import type { DifficultyLevel } from "@/types/api.types";
import { miui } from "@/theme/theme";
import { staggerContainer, staggerItem, transitionFast } from "@/theme/motion";

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

  return (
    <PageContainer sx={{ maxWidth: 1200 }}>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={transitionFast}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mb: 2 }}>
          Problem library
        </Typography>
      </motion.div>

      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Box component={motion.div} variants={staggerItem}>
        <ProblemCatalogStatsBar
          stats={statsQuery.data}
          loading={statsQuery.isLoading}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          filteredTotal={filteredTotalQuery.data?.total}
        />
        </Box>

        <Box component={motion.div} variants={staggerItem}>
        <ProblemCatalogFilters
          search={searchInput}
          onSearchChange={setSearchInput}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          includePremium={includePremium}
          onIncludePremiumChange={setIncludePremium}
        />
        </Box>

        <Box
          component={motion.div}
          variants={staggerItem}
          sx={{
            px: 0.5,
            py: 1.5,
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
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitionFast, delay: 0.12 }}
      >
        <LabSection title="Problems">
          <ProblemCatalogInfiniteList filters={catalogFilters} pageSize={PAGE_SIZE} />
        </LabSection>
      </motion.div>
    </PageContainer>
  );
}
