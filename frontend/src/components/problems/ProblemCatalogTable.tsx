import type { ReactNode } from "react";
import { Box, Chip, Typography, alpha } from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { Link as RouterLink } from "react-router-dom";
import type { ProblemCatalogItem } from "@/types/api.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { difficultyColor } from "@/utils/difficulty";
import { labAccentGradient, miui } from "@/theme/theme";

type ProblemCatalogTableProps = {
  items: ProblemCatalogItem[];
  compact?: boolean;
};

const headerSx = {
  display: "grid",
  alignItems: "center",
  gap: 1.5,
  px: 2,
  py: 1.25,
  bgcolor: alpha(miui.bg, 0.85),
  borderBottom: `1px solid ${miui.border}`,
  position: "sticky" as const,
  top: 0,
  zIndex: 2,
};

function gridColumns(compact: boolean) {
  return compact
    ? "52px minmax(0, 1fr) 96px 20px"
    : "52px minmax(0, 1fr) 108px minmax(120px, 1.2fr) 20px";
}

function HeaderCell({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "text.secondary",
        fontSize: "0.65rem",
        textAlign: align,
      }}
    >
      {children}
    </Typography>
  );
}

export function ProblemCatalogTable({ items, compact = false }: ProblemCatalogTableProps) {
  const cols = gridColumns(compact);

  return (
    <Box sx={{ overflow: "hidden", bgcolor: miui.paper }}>
      <Box sx={{ ...headerSx, gridTemplateColumns: cols }}>
        <HeaderCell>#</HeaderCell>
        <HeaderCell>Title</HeaderCell>
        <HeaderCell align="right">Level</HeaderCell>
        {!compact && <HeaderCell>Topics</HeaderCell>}
        <span />
      </Box>

      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {items.map((row, index) => {
          const accent = difficultyColor(row.difficulty);
          const isLast = index === items.length - 1;
          const shaded = index % 2 === 1;
          const rowBg = shaded ? alpha(miui.text, 0.035) : miui.paper;

          return (
            <Box
              component="li"
              key={row.id}
              sx={{
                borderBottom: isLast ? "none" : `1px solid ${miui.border}`,
                bgcolor: rowBg,
              }}
            >
              <Box
                component={RouterLink}
                to={`/problems/${row.slug}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: cols,
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: compact ? 1 : 1.35,
                  minHeight: compact ? 52 : 58,
                  textDecoration: "none",
                  color: "inherit",
                  position: "relative",
                  bgcolor: rowBg,
                  transition: "background-color 0.15s ease, box-shadow 0.15s ease",
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
                        transition: "color 0.15s ease",
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
                          border: `1px solid ${alpha("#f59e0b", 0.35)}`,
                          "& .MuiChip-icon": { color: "#b45309" },
                        }}
                      />
                    )}
                  </Box>
                  {compact && row.topics.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mt: 0.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "0.68rem",
                      }}
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
                        sx={{
                          height: 24,
                          maxWidth: "100%",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          borderColor: alpha(miui.text, 0.12),
                          bgcolor: alpha(miui.bg, 0.6),
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    ))}
                    {row.topics.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                        +{row.topics.length - 3}
                      </Typography>
                    )}
                  </Box>
                )}

                <ChevronRightRoundedIcon
                  className="catalog-chevron"
                  sx={{
                    fontSize: 20,
                    color: "text.secondary",
                    opacity: 0.35,
                    justifySelf: "end",
                    transition: "opacity 0.15s ease, transform 0.15s ease",
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No problems to show
        </Typography>
      )}
    </Box>
  );
}

export function ProblemCatalogTableChrome({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${miui.border}`,
        background: `linear-gradient(180deg, ${miui.paper} 0%, ${alpha(miui.bg, 0.35)} 100%)`,
        boxShadow: `0 1px 0 ${alpha(miui.text, 0.04)}, 0 8px 24px ${alpha(miui.primary, 0.06)}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 3,
          background: labAccentGradient,
          opacity: 0.85,
        }}
      />
      {children}
    </Box>
  );
}
