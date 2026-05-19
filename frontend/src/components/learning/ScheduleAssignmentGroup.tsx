import { Box, Typography } from "@mui/material";
import type { TrackedAssignment } from "@/types/api.types";
import { CompactAssignmentRow } from "@/components/learning/CompactAssignmentRow";
import { miui, monoStatSx } from "@/theme/theme";

type ScheduleAssignmentGroupProps = {
  scheduleName: string;
  scheduleType: TrackedAssignment["scheduleType"];
  assignments: TrackedAssignment[];
  variant?: "default" | "overdue";
};

export function ScheduleAssignmentGroup({
  scheduleName,
  assignments,
  variant = "default",
}: ScheduleAssignmentGroupProps) {
  const isOverdue = variant === "overdue";

  return (
    <Box>
      <Box
        sx={{
          bgcolor: miui.elevated,
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {!isOverdue ? (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "2px",
                bgcolor: miui.ember,
                flexShrink: 0,
              }}
            />
          ) : null}
          <Typography
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 500,
              fontSize: "13px",
              color: miui.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {scheduleName}
          </Typography>
        </Box>
        <Box
          sx={{
            ...monoStatSx,
            fontSize: "11px",
            fontWeight: 400,
            px: "6px",
            py: "1px",
            borderRadius: "4px",
            flexShrink: 0,
            ...(isOverdue
              ? {
                  color: miui.textMuted,
                }
              : {
                  bgcolor: miui.emberSoft,
                  border: `1px solid ${miui.emberBorder}`,
                  color: miui.ember,
                }),
          }}
        >
          {assignments.length}
        </Box>
      </Box>
      {assignments.map((a, i) => (
        <CompactAssignmentRow
          key={a.id}
          assignment={a}
          isLast={i === assignments.length - 1}
          variant={variant}
        />
      ))}
    </Box>
  );
}
