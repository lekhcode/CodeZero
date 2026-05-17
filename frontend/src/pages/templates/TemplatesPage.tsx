import { Box, Chip, Grid, Typography, alpha } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FixedPageShell, ScrollRegion } from "@/components/layout/FixedPageShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ExploreScheduleCard } from "@/components/cards/ExploreScheduleCard";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys } from "@/hooks/queryKeys";
import { CreateScheduleModal } from "@/modules/schedules/CreateScheduleModal";
import type { ScheduleTemplate, ScheduleType } from "@/types/api.types";
import { EXPLORE_SECTION_ORDER, EXPLORE_SECTION_TITLES } from "@/utils/scheduleCopy";
import { miui } from "@/theme/theme";

type Filter = "ALL" | ScheduleType;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "DAILY_POTD", label: "Daily" },
  { id: "STUDY_PLAN", label: "Plans" },
  { id: "TOPIC", label: "Topics" },
];

export function TemplatesPage() {
  const [modalTemplate, setModalTemplate] = useState<ScheduleTemplate | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  const templatesQuery = useQuery({
    queryKey: queryKeys.templates,
    queryFn: schedulesService.listTemplates,
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.userSchedules,
    queryFn: schedulesService.listUserSchedules,
  });

  const enrolledSlugs = new Set(schedulesQuery.data?.map((s) => s.template.slug) ?? []);
  const enrolledCount = enrolledSlugs.size;

  const grouped = useMemo(() => {
    const templates = templatesQuery.data ?? [];
    const map: Record<ScheduleType, ScheduleTemplate[]> = {
      DAILY_POTD: [],
      STUDY_PLAN: [],
      TOPIC: [],
    };
    for (const t of templates) {
      map[t.type].push(t);
    }
    return map;
  }, [templatesQuery.data]);

  const sectionsToShow = filter === "ALL" ? EXPLORE_SECTION_ORDER : [filter];

  return (
    <FixedPageShell>
      <Box sx={{ flexShrink: 0, mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          Explore
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {enrolledCount}/5 schedules enrolled · pick your practice paths
        </Typography>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          gap: 0.75,
          flexWrap: "wrap",
          mb: 1.5,
        }}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            size="small"
            clickable
            onClick={() => setFilter(f.id)}
            sx={{
              height: 28,
              fontWeight: 600,
              bgcolor: filter === f.id ? alpha(miui.primary, 0.12) : alpha("#000", 0.04),
              color: filter === f.id ? "primary.main" : "text.secondary",
              border: "none",
            }}
          />
        ))}
      </Box>

      <ScrollRegion>
        {templatesQuery.isLoading && <LoadingSkeleton count={6} />}

        {templatesQuery.data &&
          sectionsToShow.map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const section = EXPLORE_SECTION_TITLES[type];

            return (
              <Box key={type} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {section.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  {section.subtitle}
                </Typography>
                <Grid container spacing={1.5}>
                  {items.map((template) => (
                    <Grid key={template.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                      <ExploreScheduleCard
                        template={template}
                        enrolled={enrolledSlugs.has(template.slug)}
                        onEnroll={() => setModalTemplate(template)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
      </ScrollRegion>

      <CreateScheduleModal
        template={modalTemplate}
        open={Boolean(modalTemplate)}
        onClose={() => setModalTemplate(null)}
      />
    </FixedPageShell>
  );
}
