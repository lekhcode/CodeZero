import { createTheme } from "@mui/material/styles";

/** Obsidian Ink + Violet Ember — warm blacks, violet accent, ember for CTAs. */
export const miui = {
  accent: "#9B7FEA",
  accentSoft: "rgba(155, 127, 234, 0.10)",
  accentBorder: "rgba(155, 127, 234, 0.22)",
  accentStrong: "#B49AF0",
  ember: "#E8834A",
  emberSoft: "rgba(232, 131, 74, 0.10)",
  emberBorder: "rgba(232, 131, 74, 0.22)",
  bg: "#0C0B10",
  paper: "#13111A",
  elevated: "#1A1824",
  hover: "#211E2E",
  active: "#272339",
  text: "#EDE9F6",
  textMuted: "#7D7A8E",
  textDim: "#44414F",
  textGhost: "#2A2835",
  border: "#1E1C28",
  borderMid: "#272435",
  borderStrong: "#332F45",
  success: "#4ADE80",
  successSoft: "rgba(74, 222, 128, 0.08)",
  successBorder: "rgba(74, 222, 128, 0.18)",
  danger: "#FC8181",
  dangerSoft: "rgba(252, 129, 129, 0.08)",
  dangerBorder: "rgba(252, 129, 129, 0.18)",
  caution: "#F6C360",
  cautionSoft: "rgba(246, 195, 96, 0.08)",
  cautionBorder: "rgba(246, 195, 96, 0.18)",
  /** @deprecated use miui.accent */
  primary: "#9B7FEA",
  primaryLight: "#B49AF0",
  primaryDark: "#8B6FD8",
  /** @deprecated use miui.accent */
  violet: "#9B7FEA",
  violetDim: "rgba(155, 127, 234, 0.10)",
  violetBorder: "rgba(155, 127, 234, 0.22)",
  /** @deprecated use miui.accentSoft */
  info: "#9B7FEA",
  infoDim: "rgba(155, 127, 234, 0.10)",
  accentDim: "rgba(155, 127, 234, 0.10)",
  /** @deprecated use miui.caution */
  warning: "#F6C360",
  warningDim: "rgba(246, 195, 96, 0.08)",
  warningBorder: "rgba(246, 195, 96, 0.18)",
  /** @deprecated use miui.successSoft */
  successDim: "rgba(74, 222, 128, 0.08)",
  /** @deprecated use miui.dangerSoft */
  dangerDim: "rgba(252, 129, 129, 0.08)",
  heatmap: [
    "#1A1824",
    "rgba(155,127,234,0.20)",
    "rgba(155,127,234,0.45)",
    "rgba(155,127,234,0.70)",
    "#9B7FEA",
  ],
} as const;

const mono = '"JetBrains Mono", ui-monospace, monospace';
const display = '"Space Grotesk", system-ui, sans-serif';
const body = '"Inter", system-ui, sans-serif';

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: miui.accent,
      light: miui.primaryLight,
      dark: miui.primaryDark,
      contrastText: miui.bg,
    },
    secondary: {
      main: miui.accent,
      light: miui.accentStrong,
      dark: miui.primaryDark,
    },
    background: {
      default: miui.bg,
      paper: miui.paper,
    },
    text: {
      primary: miui.text,
      secondary: miui.textMuted,
      disabled: miui.textDim,
    },
    success: { main: miui.success },
    warning: { main: miui.caution },
    error: { main: miui.danger },
    info: { main: miui.accent },
    divider: miui.border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: body,
    fontSize: 14,
    button: {
      fontFamily: display,
      textTransform: "none",
      fontWeight: 500,
      fontSize: "0.875rem",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: miui.bg,
          color: miui.text,
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 20px",
          transition:
            "filter 150ms ease, transform 150ms ease, border-color 150ms ease, color 150ms ease, background-color 150ms ease",
          "@media (prefers-reduced-motion: no-preference)": {
            "&:hover": { transform: "translateY(-1px)" },
          },
        },
        contained: {
          backgroundColor: miui.ember,
          color: miui.bg,
          fontWeight: 600,
          "&:hover": {
            backgroundColor: miui.ember,
            filter: "brightness(1.10)",
          },
        },
        outlined: {
          borderColor: miui.borderStrong,
          color: miui.text,
          backgroundColor: "transparent",
          "&:hover": {
            borderColor: miui.accent,
            color: miui.accent,
            backgroundColor: "transparent",
          },
        },
        text: {
          color: miui.textMuted,
          "&:hover": { backgroundColor: miui.hover, color: miui.text },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${miui.border}`,
          backgroundColor: miui.paper,
          boxShadow: "none",
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", backgroundColor: miui.paper },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: miui.elevated,
          borderRadius: 8,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: miui.border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: miui.borderStrong },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: miui.accent },
          "&.Mui-focused": { boxShadow: `0 0 0 3px ${miui.accentSoft}` },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: miui.elevated, height: 4 },
        bar: { borderRadius: 4, backgroundColor: miui.accent },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: miui.accent,
            "& + .MuiSwitch-track": { backgroundColor: miui.accent, opacity: 0.45 },
          },
        },
        track: { backgroundColor: miui.elevated, opacity: 1 },
      },
    },
  },
});

export const glassSx = {
  background: miui.paper,
  border: `1px solid ${miui.border}`,
  boxShadow: "none",
} as const;

export const cardHoverSx = {
  transition: "border-color 150ms ease, transform 150ms ease",
  "@media (prefers-reduced-motion: no-preference)": {
    "&:hover": { borderColor: miui.borderStrong, transform: "translateY(-2px)" },
  },
} as const;

export const miuiCardSx = { ...glassSx, borderRadius: 3, ...cardHoverSx } as const;

export const sectionInsetX = { xs: 2, sm: 2.5 } as const;
export const sectionInsetY = { xs: 1.5, sm: 2 } as const;

export const sectionCardSx = { ...miuiCardSx, boxSizing: "border-box", width: "100%" } as const;

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

export const labPanelSx = { ...sectionCardSx, position: "relative" as const };

export const labAccentGradient = miui.accent;

export const monoStatSx = {
  fontFamily: mono,
  fontVariantNumeric: "tabular-nums",
} as const;

export const dashNavTabSx = (active: boolean) => ({
  minWidth: 0,
  px: 1.5,
  py: 0.75,
  borderRadius: 0,
  fontFamily: display,
  fontWeight: 500,
  fontSize: "0.8125rem",
  textTransform: "none" as const,
  bgcolor: "transparent",
  color: active ? miui.accent : miui.textMuted,
  borderBottom: "2px solid",
  borderColor: active ? miui.accent : "transparent",
  boxShadow: "none",
  transition: "color 150ms ease, border-color 150ms ease",
  "&:hover": {
    bgcolor: "transparent",
    color: active ? miui.accentStrong : miui.text,
    borderColor: active ? miui.accent : miui.borderMid,
  },
});

export const pulseDangerKeyframes = {
  "@keyframes pulse-danger": {
    "0%, 100%": { boxShadow: "0 0 0 0 rgba(252,129,129,0.35)" },
    "50%": { boxShadow: "0 0 0 6px rgba(252,129,129,0)" },
  },
};

export const pulseDangerSx = {
  ...pulseDangerKeyframes,
  "@media (prefers-reduced-motion: no-preference)": {
    animation: "pulse-danger 2s ease-in-out infinite",
  },
} as const;

export const streakGlowSx = {
  color: miui.ember,
  textShadow: "0 0 12px rgba(232, 131, 74, 0.35)",
};

export const dotGridHeroSx = {
  backgroundColor: miui.paper,
  backgroundImage: "radial-gradient(circle, #332F45 1px, transparent 1px)",
  backgroundSize: "24px 24px",
} as const;

export const neonGlow = (color: string) => `0 0 12px ${color}40`;

/** Primary CTA button sx (ember) */
export const emberButtonSx = {
  bgcolor: miui.ember,
  color: miui.bg,
  fontWeight: 600,
  "&:hover": { bgcolor: miui.ember, filter: "brightness(1.10)" },
} as const;

/** Accent link / START text */
export const accentLinkSx = {
  color: miui.accent,
  transition: "color 150ms ease, transform 150ms ease",
  "&:hover": { color: miui.accentStrong },
} as const;
