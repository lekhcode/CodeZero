import { memo } from "react";
import { Box, Chip, Typography, alpha } from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { Link as RouterLink } from "react-router-dom";
import type { ProblemCatalogItem } from "@/types/api.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { difficultyColor } from "@/utils/difficulty";
import { miui } from "@/theme/theme";

export const ROW_HEIGHT = { compact: 52, full: 58 } as const;

type ProblemCatalogRowProps = {
  row: ProblemCatalogItem;
  compact: boolean;
  index: number;
  gridColumns: string;
};

export const ProblemCatalogRow = memo(function ProblemCatalogRow({
  row,
  compact,
  index,
  gridColumns,
}: ProblemCatalogRowProps) {
  const accent = difficultyColor(row.difficulty);
  const shaded = index % 2 === 1;
  const rowBg = shaded ? alpha(miui.text, 0.035) : miui.paper;

  return (
    <Box
      sx={{
        borderBottom: `1px solid ${miui.border}`,
        bgcolor: rowBg,
      }}
    >
      <Box
        component={RouterLink}
        to={`/problems/${row.slug}`}
        sx={{
          display: "grid",
          gridTemplateColumns: gridColumns,
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: compact ? 1 : 1.35,
          minHeight: compact ? ROW_HEIGHT.compact : ROW_HEIGHT.full,
          textDecoration: "none",
          color: "inherit",
          position: "relative",
          bgcolor: rowBg,
          "&:hover": {
            bgcolor: alpha(miui.primary, 0.07),
            "& .catalog-chevron": { opacity: 1, transform: "translateX(2px)" },
            "& .catalog-title": { color: "primary.main" },
          },
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 3,
            borderRadius: 2,
            bgcolor: accent,
            opacity: 0,
            transition: "opacity 0.15s ease",
          },
          "&:hover::before": { opacity: 1 },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            fontVariantNumeric: "tabular-nums",
            fontSize: "0.8rem",
          }}
        >
          {row.leetcodeId}
        </Typography>

        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
            <Typography
              className="catalog-title"
              variant="body2"
              sx={{
                fontWeight: 650,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.title}
            </Typography>
            {row.isPremium && (
              <Chip
                icon={<LockRoundedIcon sx={{ fontSize: "14px !important" }} />}
                label="Premium"
                size="small"
                sx={{
                  height: 22,
                  flexShrink: 0,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  bgcolor: alpha("#f59e0b", 0.12),
                  color: "#b45309",
                }}
              />
            )}
          </Box>
          {compact && row.topics.length > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block", mt: 0.25, fontSize: "0.68rem" }}
            >
              {row.topics.slice(0, 3).join(" · ")}
            </Typography>
          )}
        </Box>

        <Box sx={{ justifySelf: "end" }}>
          <DifficultyChip difficulty={row.difficulty} />
        </Box>

        {!compact && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, minWidth: 0 }}>
            {row.topics.slice(0, 3).map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: "0.68rem", fontWeight: 600 }}
              />
            ))}
          </Box>
        )}

        <ChevronRightRoundedIcon
          className="catalog-chevron"
          sx={{ fontSize: 20, color: "text.secondary", opacity: 0.35, justifySelf: "end" }}
        />
      </Box>
    </Box>
  );
});

export function gridColumns(compact: boolean): string {
  return compact
    ? "52px minmax(0, 1fr) 96px 20px"
    : "52px minmax(0, 1fr) 108px minmax(120px, 1.2fr) 20px";
}
