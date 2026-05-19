import { useLayoutEffect, type RefObject } from "react";
import { Box, Typography, alpha } from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ProblemCatalogItem } from "@/types/api.types";
import {
  ProblemCatalogRow,
  ROW_HEIGHT,
  gridColumns,
} from "@/components/problems/ProblemCatalogRow";
import { FadeInCard } from "@/components/ui/FadeInCard";
import { ProblemCatalogTableChrome } from "@/components/problems/ProblemCatalogTable";
import { miui } from "@/theme/theme";

function CatalogHeader({ compact }: { compact: boolean }) {
  const cols = gridColumns(compact);
  const headerCell = (label: string, align: "left" | "right" = "left") => (
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
      {headerCell("#")}
      <span />
      {headerCell("Title")}
      {headerCell("Level", "right")}
      {!compact && headerCell("Topics")}
      <span />
    </Box>
  );
}

type ProblemCatalogVirtualTableProps = {
  items: ProblemCatalogItem[];
  compact?: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
};

export function ProblemCatalogVirtualTable({
  items,
  compact = false,
  scrollRef,
}: ProblemCatalogVirtualTableProps) {
  const rowHeight = compact ? ROW_HEIGHT.compact : ROW_HEIGHT.full;
  const cols = gridColumns(compact);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    getItemKey: (index) => items[index]?.id ?? index,
  });

  useLayoutEffect(() => {
    virtualizer.measure();
    const el = scrollRef.current;
    if (el === null) {
      return;
    }
    const ro = new ResizeObserver(() => {
      virtualizer.measure();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, virtualizer.measure]);

  return (
    <ProblemCatalogTableChrome>
      <Box sx={{ bgcolor: miui.paper }}>
        <CatalogHeader compact={compact} />
        <Box
          sx={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const row = items[vi.index];
            if (row === undefined) {
              return null;
            }
            return (
              <Box
                key={row.id}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: rowHeight,
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                <FadeInCard delay={Math.min(vi.index * 0.04, 0.32)} className="problem-row-wrap">
                  <ProblemCatalogRow
                    row={row}
                    compact={compact}
                    index={vi.index}
                    gridColumns={cols}
                  />
                </FadeInCard>
              </Box>
            );
          })}
        </Box>
      </Box>
    </ProblemCatalogTableChrome>
  );
}
