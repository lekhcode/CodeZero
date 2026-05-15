import { createTheme, alpha } from "@mui/material/styles";

/**
 * Bright, premium learning aesthetic — Plus Jakarta Sans for crisp UI typography.
 */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5",
      light: "#818cf8",
      dark: "#3730a3",
    },
    secondary: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0284c7",
    },
    background: {
      default: "#eef2f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
    success: { main: "#059669" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
    divider: alpha("#0f172a", 0.08),
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    fontSize: 15,
    h1: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 },
    h2: { fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 },
    h3: { fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25 },
    h4: { fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, lineHeight: 1.5 },
    body1: { lineHeight: 1.65, fontSize: "0.9375rem" },
    body2: { lineHeight: 1.6, fontSize: "0.875rem" },
    caption: { lineHeight: 1.5, letterSpacing: "0.01em" },
    overline: { fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1.4 },
    button: { textTransform: "none", fontWeight: 700, fontSize: "0.9375rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#eef2f8",
          backgroundImage: `
            radial-gradient(ellipse 90% 60% at 0% -10%, rgba(79, 70, 229, 0.14), transparent 50%),
            radial-gradient(ellipse 70% 50% at 100% 0%, rgba(14, 165, 233, 0.12), transparent 45%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(99, 102, 241, 0.06), transparent)
          `,
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, padding: "10px 18px" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1px solid ${alpha("#0f172a", 0.06)}`,
          boxShadow: `0 2px 12px ${alpha("#0f172a", 0.04)}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: "0.75rem" },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFeatureSettings: '"cv11", "ss01"',
        },
      },
    },
  },
});

export const glassSx = {
  background: alpha("#ffffff", 0.88),
  backdropFilter: "blur(16px)",
  border: `1px solid ${alpha("#ffffff", 0.95)}`,
  boxShadow: `0 4px 24px ${alpha("#4f46e5", 0.06)}`,
} as const;
