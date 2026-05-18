import { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  alpha,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PlaylistPlayRoundedIcon from "@mui/icons-material/PlaylistPlayRounded";
import type { BrainCachePlaylist } from "@/types/brainCache.types";
import { BrainCachePlaylistProblemsList } from "@/components/brainCache/BrainCachePlaylistProblemsList";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { bc } from "@/components/brainCache/brainCacheTheme";
import { miui, sectionInsetX } from "@/theme/theme";

type BrainCachePlaylistExplorerProps = {
  playlists: BrainCachePlaylist[];
  loading?: boolean;
  onDelete: (id: string) => void;
  deleting?: boolean;
};

export function BrainCachePlaylistExplorer({
  playlists,
  loading = false,
  onDelete,
  deleting = false,
}: BrainCachePlaylistExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (playlists.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId === null || !playlists.some((p) => p.id === selectedId)) {
      setSelectedId(playlists[0].id);
    }
  }, [playlists, selectedId]);

  const selected = playlists.find((p) => p.id === selectedId) ?? null;

  if (loading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (playlists.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
        No playlists yet. Create one, then add problems from any problem page using the Brain Cache button.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        minHeight: { md: 380 },
        border: `1px solid ${miui.border}`,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: miui.paper,
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: 260 },
          flexShrink: 0,
          borderRight: { md: `1px solid ${miui.border}` },
          borderBottom: { xs: `1px solid ${miui.border}`, md: "none" },
          maxHeight: { xs: 220, md: "none" },
          overflow: "auto",
          bgcolor: alpha(miui.bg, 0.5),
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: "block",
            px: sectionInsetX,
            py: 1,
            fontWeight: 700,
            color: "text.secondary",
            borderBottom: `1px solid ${miui.border}`,
          }}
        >
          Playlists ({playlists.length})
        </Typography>
        <List dense disablePadding>
          {playlists.map((p) => {
            const active = p.id === selectedId;
            return (
              <ListItemButton
                key={p.id}
                selected={active}
                onClick={() => setSelectedId(p.id)}
                sx={{
                  py: 1.25,
                  borderBottom: `1px solid ${miui.border}`,
                  borderLeft: active ? `3px solid ${bc.accent}` : "3px solid transparent",
                  "&.Mui-selected": {
                    bgcolor: alpha(bc.accent, 0.08),
                    "&:hover": { bgcolor: alpha(bc.accent, 0.1) },
                  },
                }}
              >
                <PlaylistPlayRoundedIcon
                  sx={{ fontSize: 18, mr: 1, color: active ? bc.accent : "text.secondary", flexShrink: 0 }}
                />
                <ListItemText
                  primary={
                    <Typography component="span" variant="body2" sx={{ fontWeight: active ? 800 : 600 }} noWrap>
                      {p.name}
                    </Typography>
                  }
                  secondary={
                    <Typography component="span" variant="caption" color="text.secondary" noWrap>
                      {`${p.problemCount} problems · every ${p.revisionIntervalDays}d`}
                    </Typography>
                  }
                />
                {(p.dueCount > 0 || p.overdueCount > 0) && (
                  <Typography variant="caption" sx={{ color: p.overdueCount > 0 ? "error.main" : bc.teal, fontWeight: 700, ml: 0.5 }}>
                    {p.overdueCount > 0 ? p.overdueCount : p.dueCount}
                  </Typography>
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            <Box
              sx={{
                px: sectionInsetX,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                borderBottom: `1px solid ${miui.border}`,
                bgcolor: miui.paper,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                  {selected.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selected.problemCount} problems · revise every {selected.revisionIntervalDays} days
                  {selected.dueCount > 0 ? ` · ${selected.dueCount} due` : ""}
                  {selected.overdueCount > 0 ? ` · ${selected.overdueCount} overdue` : ""}
                </Typography>
              </Box>
              <IconButton
                size="small"
                disabled={deleting}
                onClick={() => onDelete(selected.id)}
                aria-label="Delete playlist"
                sx={{ color: "error.main", flexShrink: 0 }}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <BrainCachePlaylistProblemsList playlist={selected} />
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            Select a playlist
          </Typography>
        )}
      </Box>
    </Box>
  );
}
