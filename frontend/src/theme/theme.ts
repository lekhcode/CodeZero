import { createTheme, alpha } from "@mui/material/styles";

/** MIUI HyperOS-inspired — warm surfaces, orange primary, soft depth. */
export const miui = {
  primary: "#FF6B00",
  primaryLight: "#FF8F3D",
  primaryDark: "#E85D00",
  accent: "#14B8A6",
  bg: "#F4F4F6",
  paper: "#FFFFFF",
  text: "#1C1C1E",
  textMuted: "#8E8E93",
  border: alpha("#1C1C1E", 0.08),
  heatmap: ["#EBEBED", "#FFD4B8", "#FFAD70", "#FF8533", "#FF6B00"],
} as const;

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: miui.primary,
      light: miui.primaryLight,
      dark: miui.primaryDark,
    },
    secondary: {
      main: miui.accent,
      light: "#2DD4BF",
      dark: "#0D9488",
    },
    background: {
      default: miui.bg,
      paper: miui.paper,
    },
    text: {
      primary: miui.text,
      secondary: miui.textMuted,
    },
    success: { main: "#22C55E" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    divider: miui.border,
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    fontSize: 15,
    h1: { fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15 },
    h2: { fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 },
    h4: { fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3 },
    h5: { fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, lineHeight: 1.45 },
    body1: { lineHeight: 1.6, fontSize: "0.9375rem" },
    body2: { lineHeight: 1.55, fontSize: "0.875rem" },
    caption: { lineHeight: 1.45, letterSpacing: "0.01em" },
    overline: { fontWeight: 700, letterSpacing: "0.06em", lineHeight: 1.4 },
    button: { textTransform: "none", fontWeight: 600, fontSize: "0.9375rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: miui.bg,
          backgroundImage: `linear-gradient(180deg, ${alpha(miui.primary, 0.04)} 0%, transparent 28%), linear-gradient(135deg, ${alpha("#14B8A6", 0.03)} 0%, transparent 40%)`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, padding: "8px 16px" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${miui.border}`,
          boxShadow: `0 2px 8px ${alpha("#000", 0.04)}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: "0.75rem" },
      },
    },
  },
});

export const glassSx = {
  background: miui.paper,
  border: `1px solid ${miui.border}`,
  boxShadow: `0 2px 12px ${alpha("#000", 0.04)}`,
} as const;

export const miuiCardSx = {
  ...glassSx,
  borderRadius: 3,
} as const;

/** Horizontal inset so titles/labels clear rounded card corners */
export const sectionInsetX = { xs: 2, sm: 2.5 } as const;
export const sectionInsetY = { xs: 1.5, sm: 2 } as const;

export const sectionCardSx = {
  ...miuiCardSx,
  boxSizing: "border-box",
  width: "100%",
} as const;

export const sectionHeaderSx = {
  px: sectionInsetX,
  py: 1.25,
  borderBottom: `1px solid ${miui.border}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 1.25,
  flexShrink: 0,
  minWidth: 0,
  boxSizing: "border-box",
} as const;

export const sectionContentSx = {
  px: sectionInsetX,
  py: sectionInsetY,
  boxSizing: "border-box",
  minWidth: 0,
  width: "100%",
} as const;

export const sectionScrollSx = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  overflow: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  px: sectionInsetX,
  py: 1,
  boxSizing: "border-box",
} as const;

export const labPanelSx = {
  ...sectionCardSx,
  position: "relative" as const,
} as const;

export const labAccentGradient = `linear-gradient(135deg, ${miui.primary} 0%, ${miui.primaryLight} 55%, ${miui.accent} 100%)`;

export const neonGlow = (color: string) =>
  `0 4px 20px ${alpha(color, 0.22)}`;
