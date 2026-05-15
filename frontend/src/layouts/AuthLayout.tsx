import { Box, Container, Typography, alpha } from "@mui/material";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { glassSx } from "@/theme/theme";

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CodeZero
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Your AI-powered LeetCode learning operating system
            </Typography>
          </Box>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Box
            sx={{
              ...glassSx,
              borderRadius: 4,
              p: { xs: 3, sm: 4 },
              bgcolor: alpha("#fff", 0.9),
            }}
          >
            <Outlet />
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
