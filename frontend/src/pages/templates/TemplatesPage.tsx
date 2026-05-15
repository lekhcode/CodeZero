import { Box, Chip, Grid, Stack, Typography, alpha } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ExploreScheduleCard } from "@/components/cards/ExploreScheduleCard";
import { schedulesService } from "@/services/schedules.service";
import { queryKeys } from "@/hooks/queryKeys";
import { CreateScheduleModal } from "@/modules/schedules/CreateScheduleModal";
import type { ScheduleTemplate, ScheduleType } from "@/types/api.types";
import { EXPLORE_SECTION_ORDER, EXPLORE_SECTION_TITLES } from "@/utils/scheduleCopy";

type Filter = "ALL" | ScheduleType;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "ALL", label: "All paths" },
  { id: "DAILY_POTD", label: "Daily" },
  { id: "STUDY_PLAN", label: "Study plans" },
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

  const sectionsToShow =
    filter === "ALL" ? EXPLORE_SECTION_ORDER : [filter];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Explore"
        title="Build your practice stack"
        subtitle="Mix daily consistency with structured plans and topic drills. Enroll in up to 5 active schedules — we assign problems automatically each day."
        action={
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 3,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              textAlign: "center",
              minWidth: 120,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main" }}>
              {enrolledCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              schedules enrolled
            </Typography>
          </Box>
        }
      />

      <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            onClick={() => setFilter(f.id)}
            color={filter === f.id ? "primary" : "default"}
            variant={filter === f.id ? "filled" : "outlined"}
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        ))}
      </Stack>

      {templatesQuery.isLoading && <LoadingSkeleton count={6} />}

      {templatesQuery.data &&
        sectionsToShow.map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const section = EXPLORE_SECTION_TITLES[type];

          return (
            <Box key={type} sx={{ mb: 5 }}>
              <Box
                sx={{
                  mb: 2.5,
                  pb: 2,
                  borderBottom: `1px solid ${alpha("#0f172a", 0.08)}`,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {section.subtitle}
                </Typography>
              </Box>
              <Grid container spacing={2.5}>
                {items.map((template) => (
                  <Grid key={template.id} size={{ xs: 12, sm: 6, lg: 4 }}>
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

      <CreateScheduleModal
        template={modalTemplate}
        open={Boolean(modalTemplate)}
        onClose={() => setModalTemplate(null)}
      />
    </PageContainer>
  );
}
