import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import type { TrackedAssignment } from "@/types/api.types";
import { accentLinkSx, miui, monoStatSx } from "@/theme/theme";

type CompactAssignmentRowProps = {
  assignment: TrackedAssignment;
  isLast?: boolean;
  variant?: "default" | "overdue";
};

export function CompactAssignmentRow({
  assignment,
  isLast = false,
  variant = "default",
}: CompactAssignmentRowProps) {
  const isOverdue = variant === "overdue";

  return (
    <Box
      component={RouterLink}
      to={`/problems/${assignment.problem.slug}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        pl: 4,
        pr: 2,
        py: 1.5,
        minHeight: 48,
        textDecoration: "none",
        color: "inherit",
        borderBottom: isLast ? "none" : `1px solid ${miui.border}`,
        transition: "color 150ms ease",
        "@media (prefers-reduced-motion: no-preference)": {
          "&:hover .start-link": {
            color: miui.text,
            transform: "translateX(2px)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: isOverdue ? miui.danger : miui.borderStrong,
        }}
      />
      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: 1.25,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: miui.text,
        }}
      >
        {assignment.problem.title}
      </Typography>

      {isOverdue ? (
        <>
          <Box
            sx={{
              ...monoStatSx,
              fontSize: "10px",
              fontWeight: 400,
              px: "6px",
              py: "1px",
              borderRadius: "3px",
              bgcolor: miui.dangerDim,
              border: `1px solid ${miui.dangerBorder}`,
              color: miui.danger,
              flexShrink: 0,
            }}
          >
            DUE
          </Box>
          <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: miui.textDim, flexShrink: 0 }} />
        </>
      ) : (
        <Typography
          className="start-link"
          sx={{
            ...accentLinkSx,
            fontSize: "12px",
            fontWeight: 500,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.25,
            "@media (prefers-reduced-motion: no-preference)": {
              "&:hover": { color: miui.accentStrong, transform: "translateX(2px)" },
            },
          }}
        >
          START →
        </Typography>
      )}
    </Box>
  );
}
