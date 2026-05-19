import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { useLogout } from "@/hooks/useAuth";
import { useMediaQuery, useTheme } from "@mui/material";
import { GlobalProblemSearch } from "@/components/layout/GlobalProblemSearch";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        color: "text.primary",
        boxShadow: "none",
        overflow: "visible",
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 }, overflow: "visible" }}>
        {isMobile && (
          <IconButton edge="start" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MenuRoundedIcon />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }} />
        {user?.email && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 1.5 },
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            <Box sx={{ alignSelf: "flex-start", pt: 0.75 }}>
              <GlobalProblemSearch />
            </Box>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14, mt: 0.75 }}>
              {user.email.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}
            >
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
