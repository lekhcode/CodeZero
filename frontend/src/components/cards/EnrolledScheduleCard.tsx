import { Card, CardContent, Chip, Stack, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";
import type { UserSchedule } from "@/types/api.types";

type EnrolledScheduleCardProps = {
  schedule: UserSchedule;
  index?: number;
};

export function EnrolledScheduleCard({ schedule, index = 0 }: EnrolledScheduleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
    >
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {schedule.template.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip label={schedule.template.type.replace("_", " ")} size="small" variant="outlined" />
              {schedule.dailyQuestions !== null && (
                <Chip label={`${schedule.dailyQuestions}/day`} size="small" variant="outlined" />
              )}
              {schedule.difficulty !== null && (
                <Chip label={schedule.difficulty} size="small" variant="outlined" />
              )}
              <Chip
                label={schedule.active ? "Active" : "Paused"}
                size="small"
                sx={{
                  fontWeight: 800,
                  color: schedule.active ? "#059669" : "#64748b",
                  bgcolor: alpha(schedule.active ? "#059669" : "#64748b", 0.1),
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}
