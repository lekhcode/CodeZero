import { createTheme } from "@mui/material/styles";

/** Metal Slate palette — cool charcoal surfaces, brushed steel accents. */
export const neutrals = {
  black: "#0A0B0D",
  graphite: "#121418",
  dark: "#1A1D23",
  elevated: "#22262E",
  hover: "#22262E",
  active: "#2A2F38",
  border: "#3A4049",
  grey: "#5C6370",
  muted: "#9AA3B0",
  offGrey: "#9AA3B0",
  offWhite: "#E8EBF0",
  white: "#E8EBF0",
} as const;

export const miui = {
  /** Logo `{0}` — pops on metal grey UI chrome */
  brandOrange: "#F97316",
  brandOrangeHover: "#FB923C",
  brandOrangeSoft: "rgba(249, 115, 22, 0.14)",
  brandOrangeBorder: "rgba(249, 115, 22, 0.45)",
  accent: "#B0B8C4",
  accentHover: "#C8CFD9",
  accentStrong: "#D4DAE3",
  accentSoft: "rgba(176, 184, 196, 0.10)",
  accentBorder: "rgba(176, 184, 196, 0.28)",
  accentGlow: "rgba(176, 184, 196, 0.14)",
  walnut: "#4B5563",
  walnutSoft: "rgba(107, 114, 128, 0.15)",
  walnutBorder: "rgba(107, 114, 128, 0.35)",
  brass: "#9AA3B0",
  charcoal: "#3A4049",
  indigo: "#9AA3B0",
  indigoSoft: "rgba(107, 114, 128, 0.15)",
  indigoBorder: "rgba(107, 114, 128, 0.35)",
  cyan: "#9AA3B0",
  cyanSoft: "rgba(107, 114, 128, 0.15)",
  cyanBorder: "rgba(107, 114, 128, 0.35)",
  ctaBg: "#B0B8C4",
  ctaText: "#0A0B0D",
  ctaHover: "#C8CFD9",
  ctaGradient: "linear-gradient(180deg, #D0D6DE 0%, #A8B0BC 100%)",
  ctaShadow: "0 4px 16px rgba(176, 184, 196, 0.22)",
  bg: neutrals.black,
  paper: neutrals.graphite,
  elevated: neutrals.dark,
  hover: neutrals.elevated,
  active: neutrals.active,
  overlay: "rgba(10, 11, 13, 0.92)",
  sidebarBg: "#0E1014",
  sidebarBorder: "rgba(107, 114, 128, 0.14)",
  topbarBg: "rgba(18, 20, 24, 0.88)",
  glassBg: "rgba(18, 20, 24, 0.82)",
  glassBorder: "rgba(107, 114, 128, 0.24)",
  text: neutrals.offWhite,
  textMuted: neutrals.offGrey,
  textDim: neutrals.grey,
  textGhost: neutrals.grey,
  border: "rgba(107, 114, 128, 0.20)",
  borderMid: "rgba(107, 114, 128, 0.30)",
  borderStrong: "rgba(107, 114, 128, 0.42)",
  borderFocus: "rgba(176, 184, 196, 0.48)",
  borderGlow: "rgba(176, 184, 196, 0.22)",
  success: "#4ADE80",
  successSoft: "rgba(74, 222, 128, 0.08)",
  successBorder: "rgba(74, 222, 128, 0.18)",
  danger: "#F87171",
  dangerSoft: "rgba(248, 113, 113, 0.08)",
  dangerBorder: "rgba(248, 113, 113, 0.18)",
  caution: "#FBBF24",
  cautionSoft: "rgba(251, 191, 36, 0.08)",
  cautionBorder: "rgba(251, 191, 36, 0.18)",
  ember: "#B0B8C4",
  emberSoft: "rgba(176, 184, 196, 0.10)",
  emberBorder: "rgba(107, 114, 128, 0.40)",
  primary: "#B0B8C4",
  primaryLight: "#C8CFD9",
  primaryDark: "#9AA3B0",
  secondary: "#9AA3B0",
  violet: "#9AA3B0",
  violetDim: "rgba(107, 114, 128, 0.15)",
  violetBorder: "rgba(107, 114, 128, 0.35)",
  info: "#9AA3B0",
  infoDim: "rgba(107, 114, 128, 0.15)",
  accentDim: "rgba(176, 184, 196, 0.10)",
  warning: "#FBBF24",
  warningDim: "rgba(251, 191, 36, 0.08)",
  warningBorder: "rgba(251, 191, 36, 0.18)",
  successDim: "rgba(74, 222, 128, 0.08)",
  dangerDim: "rgba(248, 113, 113, 0.08)",
  shadowXs: "0 1px 2px rgba(0, 0, 0, 0.4)",
  shadowSm: "0 4px 16px rgba(0, 0, 0, 0.38)",
  shadowMd: "0 8px 32px rgba(0, 0, 0, 0.45)",
  shadowLg: "0 16px 48px rgba(0, 0, 0, 0.55)",
  shadowGlow: "0 0 0 3px rgba(176, 184, 196, 0.12)",
  gradientSurface:
    "linear-gradient(180deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0) 100%)",
  gradientCard:
    "linear-gradient(165deg, rgba(107, 114, 128, 0.1) 0%, rgba(10, 11, 13, 0.2) 45%, transparent 100%)",
  gradientSidebar: "linear-gradient(180deg, rgba(107, 114, 128, 0.06) 0%, transparent 100%)",
  /** Monochrome green activity scale (GitHub-style). */
  heatmap: [
    "#1A1D23",
    "#14532D",
    "#166534",
    "#15803D",
    "#22C55E",
    "#4ADE80",
  ],
} as const;

export const numberFontFamily =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const display = '"Space Grotesk", system-ui, sans-serif';
const body = '"Inter", system-ui, sans-serif';

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: miui.accent,
      light: miui.accentHover,
      dark: miui.primaryDark,
      contrastText: miui.bg,
    },
    secondary: {
      main: miui.textMuted,
      light: neutrals.offWhite,
      dark: miui.textDim,
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
    info: { main: miui.textMuted },
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
          backgroundImage: `radial-gradient(ellipse 90% 60% at 50% -25%, rgba(176,184,196,0.06) 0%, transparent 55%)`,
          color: miui.text,
          fontVariantNumeric: "tabular-nums",
        },
        "input[type='number']": {
          fontFamily: numberFontFamily,
          fontVariantNumeric: "tabular-nums",
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
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: miui.topbarBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          backgroundImage: miui.gradientSurface,
          borderBottom: `1px solid ${miui.border}`,
          boxShadow: miui.shadowSm,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: "10px 20px",
          transition:
            "background 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
          "@media (prefers-reduced-motion: no-preference)": {
            "&:hover": { transform: "translateY(-1px)" },
          },
        },
        contained: {
          background: miui.ctaGradient,
          color: miui.ctaText,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          border: "none",
          boxShadow: miui.ctaShadow,
          "&:hover": {
            background: miui.ctaHover,
            boxShadow: miui.ctaShadow,
          },
        },
        outlined: {
          borderColor: miui.borderStrong,
          color: miui.text,
          backgroundColor: "transparent",
          "&:hover": {
            borderColor: miui.borderFocus,
            color: miui.accent,
            backgroundColor: miui.hover,
            boxShadow: miui.shadowSm,
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
          backgroundImage: miui.gradientCard,
          boxShadow: miui.shadowSm,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: miui.gradientCard,
          backgroundColor: miui.paper,
          border: `1px solid ${miui.border}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: miui.elevated,
          backgroundImage: miui.gradientSurface,
          borderRadius: 8,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: miui.borderMid },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: miui.borderStrong },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: miui.borderFocus },
          "&.Mui-focused": { boxShadow: miui.shadowGlow },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: miui.elevated, height: 4 },
        bar: {
          borderRadius: 4,
          background: `linear-gradient(90deg, ${miui.walnut}, ${miui.accent})`,
        },
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
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: miui.sidebarBg,
          backgroundImage: miui.gradientSidebar,
          borderRight: `1px solid ${miui.sidebarBorder}`,
        },
      },
    },
  },
});

export const glassSx = {
  background: miui.glassBg,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: `1px solid ${miui.glassBorder}`,
  boxShadow: miui.shadowMd,
  backgroundImage: miui.gradientSurface,
} as const;

export const cardHoverSx = {
  transition: "border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
  "@media (prefers-reduced-motion: no-preference)": {
    "&:hover": {
      borderColor: miui.borderStrong,
      transform: "translateY(-2px)",
      boxShadow: `${miui.shadowMd}, 0 0 0 1px ${miui.borderMid}`,
    },
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

export const labAccentGradient = `linear-gradient(180deg, ${miui.walnut}, ${miui.accent})`;

export const monoStatSx = {
  fontFamily: numberFontFamily,
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1',
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
  color: active ? miui.text : miui.textMuted,
  borderBottom: "2px solid",
  borderColor: active ? miui.accent : "transparent",
  boxShadow: "none",
  transition: "color 150ms ease, border-color 150ms ease",
  "&:hover": {
    bgcolor: "transparent",
    color: miui.text,
    borderColor: active ? miui.accent : miui.borderMid,
  },
});

/** Pill tabs (Brain Cache, filters) — active = light fill + dark text for contrast. */
export const segmentTabSx = (active: boolean) => ({
  textTransform: "none" as const,
  fontWeight: 500,
  fontSize: "0.8125rem",
  borderRadius: "6px",
  px: 2,
  py: 0.75,
  minWidth: 0,
  boxShadow: "none",
  transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
  ...(active
    ? {
        bgcolor: miui.ctaBg,
        color: miui.ctaText,
        border: `1px solid ${miui.borderStrong}`,
        "&:hover": {
          bgcolor: miui.ctaHover,
          color: miui.ctaText,
        },
      }
    : {
        bgcolor: "transparent",
        color: miui.textMuted,
        border: `1px solid ${miui.borderStrong}`,
        "&:hover": {
          bgcolor: miui.hover,
          color: miui.text,
          borderColor: miui.borderFocus,
        },
      }),
});

export const pulseDangerKeyframes = {
  "@keyframes pulse-danger": {
    "0%, 100%": { boxShadow: "0 0 0 0 rgba(248,113,113,0.35)" },
    "50%": { boxShadow: "0 0 0 6px rgba(248,113,113,0)" },
  },
};

export const pulseDangerSx = {
  ...pulseDangerKeyframes,
  "@media (prefers-reduced-motion: no-preference)": {
    animation: "pulse-danger 2s ease-in-out infinite",
  },
} as const;

export const streakGlowSx = {
  color: miui.accent,
  textShadow: "0 0 12px rgba(176, 184, 196, 0.35)",
};

export const dotGridHeroSx = {
  backgroundColor: miui.paper,
  backgroundImage: `radial-gradient(circle, ${miui.charcoal} 1px, transparent 1px)`,
  backgroundSize: "24px 24px",
} as const;

export const neonGlow = (color: string) => `0 0 12px ${color}40`;

export const emberButtonSx = {
  background: miui.ctaGradient,
  color: miui.ctaText,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  borderRadius: "6px",
  boxShadow: miui.ctaShadow,
  "&:hover": {
    background: miui.ctaHover,
    boxShadow: miui.ctaShadow,
  },
} as const;

export const accentLinkSx = {
  color: miui.accent,
  transition: "color 150ms ease",
  "&:hover": { color: miui.accentHover },
} as const;
