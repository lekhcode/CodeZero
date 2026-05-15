import { Box, Card, CardContent, Typography, alpha } from "@mui/material";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

type StatsCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  accent?: string;
};

export function StatsCard({ label, value, hint, icon, accent = "#4f46e5" }: StatsCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${alpha(accent, 0.08)} 0%, ${alpha("#fff", 0.9)} 60%)`,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800 }}>
              {value}
            </Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary">
                {hint}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(accent, 0.12),
                color: accent,
                display: "flex",
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
    </motion.div>
  );
}
