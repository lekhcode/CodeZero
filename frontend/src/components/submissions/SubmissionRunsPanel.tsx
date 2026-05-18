import { useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Chip,
  Collapse,
  Pagination,
  Typography,
  alpha,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import type { SubmissionListItem, SubmissionStatus } from "@/types/api.types";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmissionRunsTable } from "@/components/submissions/SubmissionRunsTable";
import { miui, sectionCardSx, sectionHeaderSx, sectionInsetX } from "@/theme/theme";

const VERDICT_FILTERS: Array<{ value: SubmissionStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "WRONG_ANSWER", label: "WA" },
  { value: "RUNTIME_ERROR", label: "RE" },
  { value: "COMPILATION_ERROR", label: "CE" },
  { value: "TIME_LIMIT_EXCEEDED", label: "TLE" },
];

const LANGUAGE_FILTERS = ["ALL", "javascript", "python", "java", "cpp"] as const;
export type SubmissionLanguageFilter = (typeof LANGUAGE_FILTERS)[number];

type SubmissionRunsPanelProps = {
  verdict: SubmissionStatus | "ALL";
  language: SubmissionLanguageFilter;
  onVerdictChange: (v: SubmissionStatus | "ALL") => void;
  onLanguageChange: (l: SubmissionLanguageFilter) => void;
  submissions: SubmissionListItem[];
  total?: number;
  totalPages: number;
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  error?: Error | null;
};

function FilterToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        m: 0,
        border: `1px solid ${active ? alpha(miui.primary, 0.45) : miui.border}`,
        borderRadius: 2,
        px: 1.25,
        py: 0.5,
        cursor: "pointer",
        fontSize: "0.78rem",
        fontWeight: active ? 700 : 500,
        fontFamily: "inherit",
        color: active ? miui.primary : "text.secondary",
        bgcolor: active ? alpha(miui.primary, 0.1) : miui.paper,
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        "&:hover": {
          borderColor: alpha(miui.primary, 0.35),
          bgcolor: alpha(miui.primary, 0.06),
        },
      }}
    >
      {label}
    </Box>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "0.62rem",
          minWidth: 52,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, flex: 1 }}>{children}</Box>
    </Box>
  );
}

export function SubmissionRunsPanel({
  verdict,
  language,
  onVerdictChange,
  onLanguageChange,
  submissions,
  total,
  totalPages,
  page,
  onPageChange,
  loading,
  error,
}: SubmissionRunsPanelProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasActiveFilters = verdict !== "ALL" || language !== "ALL";

  return (
    <Box
      sx={{
        ...sectionCardSx,
        flex: 1,
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 0,
      }}
    >
      <Box sx={{ ...sectionHeaderSx, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
          <HistoryRoundedIcon sx={{ fontSize: 18, color: miui.primary }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Recent submitted
          </Typography>
          {total !== undefined && (
            <Chip
              size="small"
              label={total.toLocaleString()}
              sx={{
                height: 22,
                fontWeight: 700,
                fontSize: "0.7rem",
                bgcolor: alpha(miui.primary, 0.1),
                color: miui.primary,
              }}
            />
          )}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          sx={{
            m: 0,
            border: `1px solid ${hasActiveFilters ? alpha(miui.primary, 0.35) : miui.border}`,
            borderRadius: 2,
            px: 1,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            bgcolor: filtersOpen ? alpha(miui.primary, 0.08) : miui.paper,
            fontFamily: "inherit",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: hasActiveFilters ? miui.primary : "text.secondary",
            "&:hover": { bgcolor: alpha(miui.primary, 0.06) },
          }}
        >
          <FilterListRoundedIcon sx={{ fontSize: 16 }} />
          Filters
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 18,
              transform: filtersOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      </Box>

      <Collapse in={filtersOpen}>
        <Box
          sx={{
            flexShrink: 0,
            px: sectionInsetX,
            py: 1.25,
            borderBottom: `1px solid ${miui.border}`,
            bgcolor: alpha(miui.bg, 0.65),
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <FilterRow label="Verdict">
            {VERDICT_FILTERS.map((f) => (
              <FilterToggle
                key={f.value}
                label={f.label}
                active={verdict === f.value}
                onClick={() => onVerdictChange(f.value)}
              />
            ))}
          </FilterRow>
          <FilterRow label="Lang">
            {LANGUAGE_FILTERS.map((lang) => (
              <FilterToggle
                key={lang}
                label={lang === "ALL" ? "All" : lang}
                active={language === lang}
                onClick={() => onLanguageChange(lang)}
              />
            ))}
          </FilterRow>
        </Box>
      </Collapse>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          px: sectionInsetX,
          py: 1.25,
          boxSizing: "border-box",
        }}
      >
        {loading ? (
          <LoadingSkeleton variant="list" count={12} />
        ) : error ? (
          <Alert severity="error">{error.message}</Alert>
        ) : submissions.length === 0 ? (
          <EmptyState
            title="No submissions"
            description="Change filters or solve a problem in the Lab."
          />
        ) : (
          <SubmissionRunsTable submissions={submissions} />
        )}
      </Box>

      {totalPages > 1 && !loading && (
        <Box
          sx={{
            flexShrink: 0,
            px: sectionInsetX,
            py: 1.25,
            borderTop: `1px solid ${miui.border}`,
            bgcolor: miui.paper,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            size="small"
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

export { VERDICT_FILTERS, LANGUAGE_FILTERS };
