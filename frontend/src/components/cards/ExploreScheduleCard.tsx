import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import type { ScheduleTemplate } from "@/types/api.types";
import { getTemplateMeta, getTypeLabel } from "@/utils/scheduleCopy";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

const TYPE_ICONS = {
  DAILY_POTD: TodayRoundedIcon,
  STUDY_PLAN: MenuBookRoundedIcon,
  TOPIC: CategoryRoundedIcon,
};

type ExploreScheduleCardProps = {
  template: ScheduleTemplate;
  enrolled?: boolean;
  onEnroll?: () => void;
};

export function ExploreScheduleCard({ template, enrolled, onEnroll }: ExploreScheduleCardProps) {
  const meta = getTemplateMeta(template.slug, template.type);
  const Icon = TYPE_ICONS[template.type];
  const [gradStart, gradEnd] = meta.gradient;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 16px 40px ${alpha(gradStart, 0.18)}`,
        },
        border: `1px solid ${alpha(gradStart, 0.2)}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 6,
          background: `linear-gradient(90deg, ${gradStart}, ${gradEnd})`,
        }}
      />
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.5 }}>
        <Stack
          direction="row"
          sx={{ mb: 2, justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${alpha(gradStart, 0.2)}, ${alpha(gradEnd, 0.1)})`,
              color: gradStart,
            }}
          >
            <Icon />
          </Box>
          <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
            <Chip label={getTypeLabel(template.type)} size="small" sx={{ fontWeight: 600 }} />
            {meta.badge && (
              <Chip label={meta.badge} size="small" color="primary" variant="outlined" />
            )}
          </Stack>
        </Stack>

        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em", mb: 0.5 }}>
          {template.name}
        </Typography>

        {meta.problemCount && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            {meta.problemCount} problems in catalog
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 2, flex: 1 }}>
          {meta.tagline}
        </Typography>

        <Stack spacing={0.75} sx={{ mb: 2 }}>
          {meta.highlights.map((h) => (
            <Typography key={h} variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: gradStart,
                  flexShrink: 0,
                }}
              />
              {h}
            </Typography>
          ))}
        </Stack>

        {template.allowsCount && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Default pace: {template.defaultCount ?? 2} problems / day
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(((template.defaultCount ?? 2) / 5) * 100, 100)}
              sx={{
                mt: 0.5,
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(gradStart, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${gradStart}, ${gradEnd})`,
                },
              }}
            />
          </Box>
        )}

        <Button
          variant={enrolled ? "outlined" : "contained"}
          fullWidth
          disabled={enrolled}
          onClick={onEnroll}
          startIcon={enrolled ? <CheckCircleRoundedIcon /> : undefined}
          sx={
            enrolled
              ? undefined
              : {
                  background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                    filter: "brightness(1.05)",
                  },
                }
          }
        >
          {enrolled ? "Added to my schedules" : "Add to my schedules"}
        </Button>
      </CardContent>
    </Card>
  );
}
