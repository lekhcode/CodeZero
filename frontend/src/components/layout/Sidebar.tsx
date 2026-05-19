import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { CodeZeroBrandLink } from "@/components/brand/CodeZeroBrandLink";
import { NavLink, useLocation } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useUiStore } from "@/store/uiStore";
import { glassSx, miui } from "@/theme/theme";

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardRoundedIcon /> },
  { to: "/lab", label: "Lab", icon: <CodeRoundedIcon /> },
  { to: "/today", label: "Today", icon: <TodayRoundedIcon /> },
  { to: "/brain-cache", label: "Brain Cache", icon: <PsychologyRoundedIcon /> },
  { to: "/submissions", label: "Submissions", icon: <HistoryRoundedIcon /> },
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
            <CodeZeroBrandLink size={36} onClick={onNavigate} />
            <Tooltip title="Collapse sidebar" placement="right">
              <IconButton size="small" onClick={toggleSidebarCollapsed} aria-label="Collapse sidebar">
                <MenuOpenRoundedIcon fontSize="small" sx={{ transform: "rotate(180deg)" }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Tooltip title="Dashboard" placement="right">
              <span>
                <CodeZeroBrandLink size={34} compact onClick={onNavigate} />
              </span>
            </Tooltip>
            <Tooltip title="Expand sidebar" placement="right">
              <IconButton onClick={toggleSidebarCollapsed} aria-label="Expand sidebar" size="small">
                <ChevronRightRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>
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
              className={active ? "nav-item active" : "nav-item"}
              sx={{
                borderRadius: 0,
                mb: 0.25,
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1 : 2,
                py: 1,
                bgcolor: active ? miui.accentSoft : "transparent",
                color: active ? "primary.main" : "text.secondary",
                "&:hover": {
                  bgcolor: miui.hover,
                  color: "text.primary",
                },
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
        bgcolor: miui.paper,
        borderRight: `1px solid ${miui.border}`,
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
