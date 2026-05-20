import { Box, ClickAwayListener, IconButton, Paper, Typography } from "@mui/material";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import { useRef, useState } from "react";
import { EMOJI_CATEGORIES, EMOJI_SETS, type EmojiCategoryKey } from "./forumEmojiData";
import { miui } from "@/theme/theme";

const flatInputSx = {
  borderRadius: 0,
  bgcolor: miui.paper,
  border: `1px solid ${miui.border}`,
} as const;

type ForumEmojiPickerButtonProps = {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  size?: "small" | "medium";
};

export function ForumEmojiPickerButton({
  onPick,
  disabled = false,
  size = "medium",
}: ForumEmojiPickerButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<EmojiCategoryKey>("smileys");

  const pick = (emoji: string) => {
    onPick(emoji);
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box ref={wrapRef} sx={{ position: "relative", flexShrink: 0 }}>
        <IconButton
          type="button"
          size={size}
          disabled={disabled}
          aria-label="Insert emoji"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          sx={{
            borderRadius: 0,
            border: `1px solid ${miui.border}`,
            color: open ? miui.brandOrange : miui.textMuted,
            bgcolor: open ? miui.elevated : "transparent",
            "&:hover": { bgcolor: miui.hover, color: miui.text },
          }}
        >
          <EmojiEmotionsOutlinedIcon fontSize={size === "small" ? "small" : "medium"} />
        </IconButton>

        {open && (
          <Paper
            elevation={0}
            role="dialog"
            aria-label="Emoji picker"
            sx={{
              position: "absolute",
              right: 0,
              bottom: "calc(100% + 6px)",
              zIndex: 20,
              width: 280,
              p: 1,
              ...flatInputSx,
              boxShadow: miui.shadowMd,
            }}
          >
            <Box sx={{ display: "flex", gap: 0.5, mb: 1, borderBottom: `1px solid ${miui.border}`, pb: 0.75 }}>
              {EMOJI_CATEGORIES.map(({ key, icon }) => (
                <IconButton
                  key={key}
                  type="button"
                  size="small"
                  onClick={() => setCategory(key)}
                  sx={{
                    borderRadius: 0,
                    fontSize: "1rem",
                    width: 32,
                    height: 28,
                    bgcolor: category === key ? miui.elevated : "transparent",
                    border: category === key ? `1px solid ${miui.borderMid}` : "1px solid transparent",
                  }}
                >
                  {icon}
                </IconButton>
              ))}
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 0.25,
                maxHeight: 160,
                overflow: "auto",
              }}
            >
              {EMOJI_SETS[category].map((emoji) => (
                <IconButton
                  key={emoji}
                  type="button"
                  onClick={() => pick(emoji)}
                  sx={{
                    borderRadius: 0,
                    fontSize: "1.1rem",
                    width: 32,
                    height: 32,
                    p: 0,
                    "&:hover": { bgcolor: miui.hover },
                  }}
                >
                  <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                    {emoji}
                  </Typography>
                </IconButton>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
