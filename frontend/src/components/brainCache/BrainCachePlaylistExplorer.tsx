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
import { FadeInCard } from "@/components/ui/FadeInCard";
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
        Your training journal is empty. Build your first playlist.
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
          width: { xs: "100%", md: "auto" },
          minWidth: { md: 220 },
          maxWidth: { md: 260 },
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
            fontWeight: 500,
            color: miui.textMuted,
            borderBottom: `1px solid ${miui.border}`,
          }}
        >
          Playlists ({playlists.length})
        </Typography>
        <List dense disablePadding>
          {playlists.map((p, index) => {
            const active = p.id === selectedId;
            return (
              <FadeInCard key={p.id} delay={Math.min(index * 0.08, 0.24)} className="card">
              <ListItemButton
                selected={active}
                onClick={() => setSelectedId(p.id)}
                sx={{
                  py: 1.25,
                  borderBottom: `1px solid ${miui.border}`,
                  borderLeft: active ? `3px solid ${miui.accent}` : "3px solid transparent",
                  "&.Mui-selected": {
                    bgcolor: miui.hover,
                    "&:hover": { bgcolor: miui.hover },
                  },
                }}
              >
                <PlaylistPlayRoundedIcon
                  sx={{ fontSize: 18, mr: 1, color: active ? miui.accent : miui.textMuted, flexShrink: 0 }}
                />
                <ListItemText
                  disableTypography
                  sx={{ minWidth: 0, mr: 0.5 }}
                  primary={
                    <Typography
                      component="span"
                      title={p.name}
                      variant="body2"
                      sx={{
                        fontWeight: active ? 500 : 400,
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: miui.text,
                      }}
                    >
                      {p.name}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      component="span"
                      title={`${p.problemCount} problems · every ${p.revisionIntervalDays}d`}
                      sx={{
                        display: "block",
                        fontSize: "11px",
                        color: miui.textMuted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        mt: 0.25,
                        fontWeight: 400,
                      }}
                    >
                      {`${p.problemCount} problems · every ${p.revisionIntervalDays}d`}
                    </Typography>
                  }
                />
                {(p.dueCount > 0 || p.overdueCount > 0) && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: p.overdueCount > 0 ? miui.danger : miui.textMuted,
                      fontWeight: 400,
                      ml: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {p.overdueCount > 0 ? p.overdueCount : p.dueCount}
                  </Typography>
                )}
              </ListItemButton>
              </FadeInCard>
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
                <Typography
                  variant="subtitle2"
                  title={selected.name}
                  sx={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
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
