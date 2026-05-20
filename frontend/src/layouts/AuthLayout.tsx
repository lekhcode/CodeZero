import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { CodeZeroBrandLink } from "@/components/brand/CodeZeroBrandLink";
import { AppCopyright } from "@/components/layout/AppCopyright";
import { glassSx, miui } from "@/theme/theme";

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
        bgcolor: miui.bg,
      }}
    >
      <Container maxWidth="xs" disableGutters sx={{ maxWidth: 420 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <CodeZeroBrandLink size={44} />
          </Box>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05, duration: 0.2 }}>
          <Box
            sx={{
              ...glassSx,
              borderRadius: 4,
              p: 5,
              maxWidth: 420,
              mx: "auto",
            }}
          >
            <Outlet />
          </Box>
        </motion.div>
        <Box sx={{ mt: 2.5 }}>
          <AppCopyright align="center" />
        </Box>
      </Container>
    </Box>
  );
}
