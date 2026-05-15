import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { tokenStorage } from "@/utils/storage";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useMe } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ApiRequestError } from "@/services/api";

/**
 * Guards private routes — hydrates user from /users/me when token exists.
 * Keeps session after login if /me is slow; only clears auth on 401.
 */
export function ProtectedRoute() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const hasToken = Boolean(tokenStorage.get());

  const { isLoading, isError, error, data } = useMe(hasToken);

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError && error instanceof ApiRequestError && error.status === 401) {
      logout();
    }
  }, [isError, error, logout]);

  if (!hasToken && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading && user === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError && user === null) {
    return (
      <Box sx={{ p: 4, maxWidth: 480, mx: "auto" }}>
        <Alert severity="error">
          Could not verify your session. Is the backend running on port 2026?
          {error instanceof Error ? ` (${error.message})` : null}
        </Alert>
      </Box>
    );
  }

  return <Outlet />;
}
