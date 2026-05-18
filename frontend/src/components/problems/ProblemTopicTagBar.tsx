import { useMemo, useState } from "react";
import { Box, Button, Typography, alpha } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import { motion } from "framer-motion";
import type { ProblemTopicTag } from "@/types/api.types";
import { springSnappy, tapPress, transitionFast } from "@/theme/motion";
import { miui } from "@/theme/theme";

const COLLAPSED_VISIBLE = 8;

type ProblemTopicTagBarProps = {
  topicTags: ProblemTopicTag[];
  selected: string[];
  onToggle: (topic: string) => void;
  loading?: boolean;
};

export function ProblemTopicTagBar({
  topicTags,
  selected,
  onToggle,
  loading = false,
}: ProblemTopicTagBarProps) {
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => {
    if (expanded) {
      return topicTags;
    }
    return topicTags.slice(0, COLLAPSED_VISIBLE);
  }, [expanded, topicTags]);

  const hasMore = topicTags.length > COLLAPSED_VISIBLE;

  if (loading && topicTags.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading topics…
      </Typography>
    );
  }

  if (topicTags.length === 0) {
    return null;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: expanded ? "wrap" : "nowrap",
          gap: 1,
          alignItems: "center",
          overflowX: expanded ? "visible" : "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: alpha(miui.text, 0.12),
            borderRadius: 3,
          },
        }}
      >
        {visible.map((tag) => {
          const active = selected.includes(tag.name);
          return (
            <Box
              key={tag.name}
              component={motion.button}
              type="button"
              onClick={() => onToggle(tag.name)}
              whileHover={{ scale: 1.03 }}
              whileTap={tapPress}
              animate={{
                backgroundColor: active ? alpha(miui.primary, 0.1) : alpha(miui.text, 0.05),
                borderColor: active ? alpha(miui.primary, 0.35) : "transparent",
              }}
              transition={springSnappy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                border: "1px solid",
                borderRadius: 10,
                cursor: "pointer",
                padding: "6px 10px",
                margin: 0,
                color: active ? miui.primary : miui.text,
                fontWeight: active ? 700 : 500,
                fontSize: "0.8125rem",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>{tag.name}</span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: 6,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  background: active ? alpha(miui.primary, 0.15) : alpha(miui.text, 0.08),
                  color: active ? miui.primary : miui.textMuted,
                }}
              >
                {tag.count.toLocaleString()}
              </span>
            </Box>
          );
        })}

        {hasMore && !expanded && (
          <Button
            size="small"
            endIcon={<ExpandMoreRoundedIcon />}
            onClick={() => setExpanded(true)}
            sx={{
              flexShrink: 0,
              textTransform: "none",
              fontWeight: 600,
              color: "text.secondary",
              minWidth: "auto",
              borderRadius: 2,
            }}
          >
            Expand
          </Button>
        )}
      </Box>

      {expanded && hasMore && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transitionFast}>
          <Button
            size="small"
            startIcon={<ExpandLessRoundedIcon />}
            onClick={() => setExpanded(false)}
            sx={{ mt: 0.75, textTransform: "none", fontWeight: 600, color: "text.secondary" }}
          >
            Show less
          </Button>
        </motion.div>
      )}
    </Box>
  );
}
