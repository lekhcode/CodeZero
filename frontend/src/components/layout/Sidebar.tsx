import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useUiStore } from "@/store/uiStore";
import { glassSx } from "@/theme/theme";

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardRoundedIcon /> },
  { to: "/templates", label: "Explore", icon: <ExploreRoundedIcon /> },
  { to: "/schedules", label: "My schedules", icon: <EventNoteRoundedIcon /> },
];

function NavContent({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: collapsed ? 1 : 2 }}>
      <Box
        sx={{
          mb: 2,
          px: collapsed ? 0 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 0.5,
        }}
      >
        {!collapsed ? (
          <>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1.1,
                }}
              >
                CodeZero
              </Typography>
              <Typography variant="caption" color="text.secondary">
                AI learning OS
              </Typography>
            </Box>
            <Tooltip title="Collapse sidebar" placement="right">
              <IconButton size="small" onClick={toggleSidebarCollapsed} aria-label="Collapse sidebar">
                <MenuOpenRoundedIcon fontSize="small" sx={{ transform: "rotate(180deg)" }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton onClick={toggleSidebarCollapsed} aria-label="Expand sidebar" size="small">
              <ChevronRightRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <List sx={{ flex: 1, px: collapsed ? 0 : undefined }}>
        {NAV.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const btn = (
            <ListItemButton
              component={NavLink}
              to={item.to}
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1 : 2,
                bgcolor: active ? alpha("#4f46e5", 0.1) : "transparent",
                color: active ? "primary.main" : "text.primary",
                "&:hover": { bgcolor: alpha("#4f46e5", 0.06) },
              }}
            >
              <ListItemIcon
                sx={{ color: "inherit", minWidth: collapsed ? 0 : 40, justifyContent: "center" }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: active ? 700 : 500 } } }}
                />
              )}
            </ListItemButton>
          );
          return collapsed ? (
            <Tooltip key={item.to} title={item.label} placement="right">
              {btn}
            </Tooltip>
          ) : (
            <Box key={item.to}>{btn}</Box>
          );
        })}
      </List>
    </Box>
  );
}

export function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        slotProps={{ paper: { sx: { width: DRAWER_WIDTH, ...glassSx } } }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton onClick={() => setSidebarOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <NavContent onNavigate={() => setSidebarOpen(false)} />
      </Drawer>
    );
  }

  const width = sidebarCollapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box
      component="aside"
      sx={{
        width,
        transition: theme.transitions.create("width", { duration: theme.transitions.duration.shorter }),
        flexShrink: 0,
        ...glassSx,
        borderRight: 1,
        borderColor: "divider",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      <NavContent collapsed={sidebarCollapsed} />
    </Box>
  );
}

export const SIDEBAR_WIDTH = DRAWER_WIDTH;
export const SIDEBAR_COLLAPSED_WIDTH = DRAWER_COLLAPSED;
