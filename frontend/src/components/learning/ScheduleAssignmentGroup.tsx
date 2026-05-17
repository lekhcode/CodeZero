import type { ReactNode } from "react";
import { Box, Chip, Typography, alpha } from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import type { TrackedAssignment, ScheduleType } from "@/types/api.types";
import { CompactAssignmentRow } from "@/components/learning/CompactAssignmentRow";
import { miui, sectionInsetX } from "@/theme/theme";

const TYPE_META: Record<
  ScheduleType,
  { icon: ReactNode; color: string }
> = {
  DAILY_POTD: { icon: <TodayRoundedIcon sx={{ fontSize: 14 }} />, color: "#0EA5E9" },
  STUDY_PLAN: { icon: <MenuBookRoundedIcon sx={{ fontSize: 14 }} />, color: miui.primary },
  TOPIC: { icon: <CategoryRoundedIcon sx={{ fontSize: 14 }} />, color: "#14B8A6" },
};

type ScheduleAssignmentGroupProps = {
  scheduleName: string;
  scheduleType: ScheduleType;
  assignments: TrackedAssignment[];
  variant?: "default" | "overdue";
};

export function ScheduleAssignmentGroup({
  scheduleName,
  scheduleType,
  assignments,
  variant = "default",
}: ScheduleAssignmentGroupProps) {
  const meta = TYPE_META[scheduleType];
  const isOverdue = variant === "overdue";

  return (
    <Box
      sx={{
        mb: 1.25,
        borderRadius: 2,
        border: `1px solid ${isOverdue ? alpha("#EF4444", 0.25) : miui.border}`,
        bgcolor: isOverdue ? alpha("#EF4444", 0.03) : alpha("#fff", 0.6),
        borderLeft: isOverdue ? `3px solid #EF4444` : `3px solid ${meta.color}`,
      }}
    >
      <Box
        sx={{
          px: sectionInsetX,
          py: 0.85,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          bgcolor: alpha(meta.color, 0.06),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          <Box sx={{ color: meta.color, display: "flex" }}>{meta.icon}</Box>
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {scheduleName}
          </Typography>
        </Box>
        <Chip
          label={`${assignments.length}`}
          size="small"
          sx={{
            height: 20,
            fontSize: "0.65rem",
            fontWeight: 800,
            bgcolor: alpha(meta.color, 0.12),
            color: meta.color,
          }}
        />
      </Box>
      {assignments.map((a, i) => (
        <CompactAssignmentRow key={a.id} assignment={a} isLast={i === assignments.length - 1} />
      ))}
    </Box>
  );
}
