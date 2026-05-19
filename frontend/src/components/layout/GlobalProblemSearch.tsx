import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { DifficultyChip } from "@/components/ui/DifficultyChip";
import { ProblemSolvedIndicator } from "@/components/problems/ProblemSolvedIndicator";
import { queryKeys } from "@/hooks/queryKeys";
import { problemsService } from "@/services/problems.service";
import { rankProblemSearchResults } from "@/utils/problemSearchRank";
import { miui, monoStatSx } from "@/theme/theme";

const RESULT_LIMIT = 40;

const SHELL_WIDTH = {
  xs: "min(calc(100vw - 100px), 320px)",
  sm: 440,
  md: 520,
  lg: 580,
  xl: 620,
} as const;

const panelMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
};

export function GlobalProblemSearch() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [open, setOpen] = useState(false);

  const trimmed = submitted.trim();
  const showPanel = open && trimmed.length > 0;

  const searchQuery = useQuery({
    queryKey: queryKeys.problemCatalog({ globalSearch: trimmed, limit: RESULT_LIMIT }),
    queryFn: () =>
      problemsService.list({
        search: trimmed,
        page: 1,
        limit: RESULT_LIMIT,
        includePremium: true,
      }),
    enabled: showPanel,
    staleTime: 30_000,
  });

  const results =
    trimmed.length > 0 && searchQuery.data
      ? rankProblemSearchResults(searchQuery.data.items, trimmed)
      : [];

  const runSearch = useCallback(() => {
    const q = input.trim();
    if (q.length === 0) {
      setSubmitted("");
      setOpen(false);
      return;
    }
    setSubmitted(q);
    setOpen(true);
  }, [input]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const pick = useCallback(
    (slug: string) => {
      close();
      setInput("");
      setSubmitted("");
      navigate(`/problems/${slug}`);
    },
    [close, navigate],
  );

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [close]);

  return (
    <Box
      ref={rootRef}
      className="global-problem-search"
      sx={{
        position: "relative",
        width: SHELL_WIDTH,
        minWidth: { xs: 240, sm: 440 },
        maxWidth: "100%",
        flexShrink: 0,
        zIndex: (t) => t.zIndex.modal,
      }}
    >
      <Box
        sx={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: showPanel ? "12px 12px 0 0" : "12px",
          border: `1px solid ${showPanel ? miui.accentBorder : miui.border}`,
          bgcolor: showPanel ? "rgba(12, 11, 16, 0.72)" : miui.elevated,
          backdropFilter: showPanel ? "blur(12px)" : "none",
          WebkitBackdropFilter: showPanel ? "blur(12px)" : "none",
          boxShadow: showPanel
            ? `0 4px 20px rgba(0,0,0,0.25)`
            : "none",
          transition:
            "border-color 200ms ease, border-radius 200ms ease, background-color 200ms ease, box-shadow 200ms ease",
          overflow: "hidden",
        }}
      >
        <TextField
          inputRef={inputRef}
          size="small"
          fullWidth
          placeholder="Search problems…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          onFocus={() => {
            if (trimmed.length > 0) setOpen(true);
          }}
          slotProps={{
            input: {
              "aria-label": "Search problems",
              "aria-expanded": showPanel,
              "aria-controls": showPanel ? "global-problem-search-results" : undefined,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={runSearch}
                    aria-label="Search"
                    edge="end"
                    sx={{
                      color: miui.textMuted,
                      transition: "color 150ms ease, transform 150ms ease",
                      "&:hover": { color: miui.accent, transform: "scale(1.05)" },
                    }}
                  >
                    <SearchRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-root": {
              width: "100%",
              bgcolor: "transparent",
              borderRadius: 0,
              fontSize: "0.875rem",
              py: 0.25,
              transition: "background-color 150ms ease",
              "& fieldset": { border: "none" },
              "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
              "&.Mui-focused": { bgcolor: "rgba(255,255,255,0.03)" },
            },
          }}
        />
      </Box>

      <AnimatePresence>
        {showPanel ? (
          <Box
            component={motion.div}
            key="results-panel"
            id="global-problem-search-results"
            role="listbox"
            {...panelMotion}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "0 0 12px 12px",
              border: `1px solid ${miui.accentBorder}`,
              borderTop: `1px solid ${miui.border}`,
              bgcolor: "rgba(12, 11, 16, 0.5)",
              backdropFilter: "blur(18px) saturate(1.15)",
              WebkitBackdropFilter: "blur(18px) saturate(1.15)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                overflowX: "hidden",
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: miui.borderStrong,
                  borderRadius: 99,
                },
              }}
            >
              {searchQuery.isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={22} />
                </Box>
              ) : searchQuery.isError ? (
                <Typography variant="body2" color="error" sx={{ p: 2 }}>
                  Could not load results. Try again.
                </Typography>
              ) : results.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No problems match &ldquo;{trimmed}&rdquo;.
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      px: 1.5,
                      py: 1,
                      color: miui.textMuted,
                      borderBottom: `1px solid rgba(30, 28, 40, 0.55)`,
                    }}
                  >
                    {results.length}
                    {searchQuery.data && searchQuery.data.total > results.length
                      ? ` of ${searchQuery.data.total}`
                      : ""}{" "}
                    results
                  </Typography>
                  <List dense disablePadding>
                    {results.map((item) => (
                      <ListItemButton
                        key={item.id}
                        onClick={() => pick(item.slug)}
                        sx={{
                          py: 1.1,
                          px: 1.5,
                          gap: 1,
                          alignItems: "flex-start",
                          borderBottom: `1px solid rgba(30, 28, 40, 0.45)`,
                          transition: "background-color 120ms ease",
                          "&:last-of-type": { borderBottom: "none" },
                          "&:hover": { bgcolor: "rgba(33, 30, 46, 0.55)" },
                        }}
                      >
                        <Typography
                          sx={{
                            ...monoStatSx,
                            fontSize: "11px",
                            color: miui.textMuted,
                            minWidth: 28,
                            mt: 0.35,
                            flexShrink: 0,
                          }}
                        >
                          {item.leetcodeId}
                        </Typography>
                        <Box sx={{ mt: 0.35, flexShrink: 0 }}>
                          <ProblemSolvedIndicator solved={item.solved} />
                        </Box>
                        <ListItemText
                          primary={item.title}
                          sx={{
                            minWidth: 0,
                            flex: 1,
                            m: 0,
                            "& .MuiListItemText-primary": {
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              lineHeight: 1.35,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              whiteSpace: "normal",
                            },
                          }}
                        />
                        <Box sx={{ mt: 0.25, flexShrink: 0 }}>
                          <DifficultyChip difficulty={item.difficulty} />
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>
                </>
              )}
            </Box>
          </Box>
        ) : null}
      </AnimatePresence>
    </Box>
  );
}
