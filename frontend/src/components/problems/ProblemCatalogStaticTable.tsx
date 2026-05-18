import { Box, Typography, alpha } from "@mui/material";
import type { ProblemCatalogItem } from "@/types/api.types";
import { ProblemCatalogRow, gridColumns } from "@/components/problems/ProblemCatalogRow";
import { ProblemCatalogTableChrome } from "@/components/problems/ProblemCatalogTable";
import { miui } from "@/theme/theme";

function CatalogHeader({ compact }: { compact: boolean }) {
  const cols = gridColumns(compact);
  const cell = (label: string, align: "left" | "right" = "left") => (
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
      {label}
    </Typography>
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: cols,
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        bgcolor: alpha(miui.bg, 0.92),
        borderBottom: `1px solid ${miui.border}`,
        position: "sticky",
        top: 0,
        zIndex: 2,
      }}
    >
      {cell("#")}
      {cell("Title")}
      {cell("Level", "right")}
      {!compact && cell("Topics")}
      <span />
    </Box>
  );
}

type ProblemCatalogStaticTableProps = {
  items: ProblemCatalogItem[];
  compact?: boolean;
};

/** Plain list (no virtualizer) — use for small previews e.g. dashboard. */
export function ProblemCatalogStaticTable({ items, compact = false }: ProblemCatalogStaticTableProps) {
  const cols = gridColumns(compact);

  return (
    <ProblemCatalogTableChrome>
      <Box sx={{ bgcolor: miui.paper }}>
        <CatalogHeader compact={compact} />
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map((row, index) => (
            <Box component="li" key={row.id}>
              <ProblemCatalogRow row={row} compact={compact} index={index} gridColumns={cols} />
            </Box>
          ))}
        </Box>
      </Box>
    </ProblemCatalogTableChrome>
  );
}
