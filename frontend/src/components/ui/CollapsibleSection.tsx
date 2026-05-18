import { useState, type ReactNode } from "react";
import { Box, Collapse, IconButton, Typography, alpha } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { miui } from "@/theme/theme";

type CollapsibleSectionProps = {
  title: ReactNode;
  summary?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  /** When collapsed, hide inner padding wrapper */
  dense?: boolean;
};

export function CollapsibleSection({
  title,
  summary,
  defaultExpanded = false,
  children,
  dense = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <Box
      sx={{
        flexShrink: 0,
        borderRadius: 2.5,
        border: `1px solid ${miui.border}`,
        bgcolor: miui.paper,
        overflow: "hidden",
        mb: 1,
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: dense ? 0.75 : 1,
          border: "none",
          cursor: "pointer",
          bgcolor: open ? alpha(miui.primary, 0.04) : "transparent",
          transition: "background 0.15s ease",
          "&:hover": { bgcolor: alpha(miui.primary, 0.06) },
        }}
      >
        <IconButton
          size="small"
          tabIndex={-1}
          aria-hidden
          sx={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: miui.primary,
          }}
        >
          <ExpandMoreRoundedIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1, textAlign: "left" }}>
          {title}
        </Typography>
        {!open && summary ? (
          <Box sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{summary}</Box>
        ) : null}
      </Box>
      <Collapse in={open} timeout={220}>
        <Box sx={{ px: dense ? 1.5 : 2, pb: dense ? 1.25 : 1.5, pt: 0 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
