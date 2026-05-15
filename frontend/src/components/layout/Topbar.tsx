import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { useLogout } from "@/hooks/useAuth";
import { useMediaQuery, useTheme } from "@mui/material";

export function Topbar({ title }: { title?: string }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: alpha("#ffffff", 0.85),
        backdropFilter: "blur(12px)",
        borderBottom: 1,
        borderColor: "divider",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        {isMobile && (
          <IconButton edge="start" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MenuRoundedIcon />
          </IconButton>
        )}
        {!isMobile && (
          <Tooltip title="Toggle sidebar width">
            <IconButton edge="start" onClick={() => toggleSidebarCollapsed()} aria-label="Toggle sidebar">
              <ViewSidebarRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          {title ?? "Dashboard"}
        </Typography>
        {user?.email && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14 }}>
              {user.email.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              {user.email}
            </Typography>
            <IconButton onClick={logout} aria-label="Logout" color="inherit">
              <LogoutRoundedIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
