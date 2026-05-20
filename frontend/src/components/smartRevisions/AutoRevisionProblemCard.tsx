import { Box, Button, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Link as RouterLink } from "react-router-dom";
import type { AutoRevisionItem } from "@/types/autoRevision.types";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { bc } from "@/components/brainCache/brainCacheTheme";
import { miui } from "@/theme/theme";

type AutoRevisionProblemCardProps = {
  item: AutoRevisionItem;
  onRevise: (id: string, slug: string) => void;
  busy?: boolean;
};

export function AutoRevisionProblemCard({ item, onRevise, busy = false }: AutoRevisionProblemCardProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        py: 1.25,
        px: 1.5,
        borderBottom: `1px solid ${miui.border}`,
        opacity: item.isRevised ? 0.72 : 1,
      }}
    >
      <Box sx={{ color: item.isRevised ? bc.success : miui.textMuted, display: "flex", mt: 0.25 }}>
        <CheckCircleRoundedIcon sx={{ fontSize: 18, opacity: item.isRevised ? 1 : 0.35 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component={RouterLink}
          to={`/problems/${item.slug}`}
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: '"Space Grotesk", sans-serif',
            color: miui.text,
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "&:hover": { color: miui.accent },
          }}
        >
          {item.problemTitle}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5, alignItems: "center" }}>
          <DifficultyChip difficulty={item.difficulty} />
          <Typography
            sx={{
              fontSize: "11px",
              color: miui.textMuted,
              fontFamily: "var(--font-number)",
            }}
          >
            {item.scheduledFor}
          </Typography>
        </Box>
      </Box>
      {!item.isRevised ? (
        <Button
          size="small"
          variant="outlined"
          disabled={busy}
          onClick={() => onRevise(item.id, item.slug)}
          sx={{ flexShrink: 0, borderColor: miui.accentBorder, color: miui.accent }}
        >
          Revise now
        </Button>
      ) : (
        <Typography sx={{ fontSize: "11px", color: bc.success, fontWeight: 600, flexShrink: 0 }}>
          Done
        </Typography>
      )}
    </Box>
  );
}
