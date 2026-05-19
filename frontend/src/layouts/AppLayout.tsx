import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PageTransition } from "@/components/ui/PageTransition";
import { miui } from "@/theme/theme";

/** Shell for authenticated routes — sidebar + topbar + animated outlet. */
export function AppLayout() {
  return (
    <Box sx={{ display: "flex", height: "100dvh", maxHeight: "100dvh", overflow: "hidden", bgcolor: miui.bg }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>
        <Topbar />
        <Box
          sx={{
            flex: 1,
            bgcolor: miui.bg,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Box>
      </Box>
    </Box>
  );
}
