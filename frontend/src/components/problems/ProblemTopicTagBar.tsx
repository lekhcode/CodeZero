import { useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
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
        className={expanded ? undefined : "app-scroll"}
        sx={{
          display: "flex",
          flexWrap: expanded ? "wrap" : "nowrap",
          gap: 1,
          alignItems: "center",
          overflowX: expanded ? "visible" : "auto",
          pb: 0.5,
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
                backgroundColor: active ? miui.accentDim : miui.elevated,
                borderColor: active ? miui.primary : miui.border,
              }}
              transition={springSnappy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                border: "1px solid",
                borderRadius: 6,
                cursor: "pointer",
                padding: "6px 10px",
                margin: 0,
                color: active ? miui.primary : miui.textMuted,
                fontWeight: active ? 600 : 500,
                fontSize: "0.6875rem",
                fontFamily: "var(--font-number)",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>{tag.name}</span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "var(--font-number)",
                  background: miui.bg,
                  color: miui.textMuted,
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
