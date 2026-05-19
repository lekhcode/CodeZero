import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { theme } from "@/theme/theme";
import { AppRouter } from "@/routes/AppRouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

/**
 * Root app shell — providers only; routing lives in AppRouter for testability.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <AmbientBackground />
          <AppRouter />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
