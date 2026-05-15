import { Box, Button, Card, CardContent, Chip, Stack, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";
import type { ScheduleTemplate } from "@/types/api.types";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

const typeMeta = {
  DAILY_POTD: { label: "Daily", icon: <TodayRoundedIcon fontSize="small" />, color: "#0ea5e9" },
  STUDY_PLAN: { label: "Study plan", icon: <MenuBookRoundedIcon fontSize="small" />, color: "#4f46e5" },
  TOPIC: { label: "Topic", icon: <CategoryRoundedIcon fontSize="small" />, color: "#059669" },
};

type ScheduleCardProps = {
  template: ScheduleTemplate;
  enrolled?: boolean;
  onEnroll?: () => void;
  index?: number;
};

export function ScheduleCard({ template, enrolled, onEnroll, index = 0 }: ScheduleCardProps) {
  const meta = typeMeta[template.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
    >
    <Card
      sx={{
        height: "100%",
        borderTop: `3px solid ${meta.color}`,
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: 1.5,
                bgcolor: alpha(meta.color, 0.12),
                color: meta.color,
                display: "flex",
              }}
            >
              {meta.icon}
            </Box>
            <Chip label={meta.label} size="small" sx={{ fontWeight: 600 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {template.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {template.type === "DAILY_POTD"
              ? "Official LeetCode problem of the day"
              : template.allowsCount
                ? `Practice ${template.defaultCount ?? 1}–5 questions per day`
                : "Structured practice track"}
          </Typography>
        </Stack>
        <Button
          variant={enrolled ? "outlined" : "contained"}
          fullWidth
          sx={{ mt: 2 }}
          disabled={enrolled}
          onClick={onEnroll}
        >
          {enrolled ? "Enrolled" : "Add to my schedules"}
        </Button>
      </CardContent>
    </Card>
    </motion.div>
  );
}
