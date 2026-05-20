import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { tokenStorage } from "@/utils/storage";
import { queryKeys } from "./queryKeys";
import { ApiRequestError } from "@/services/api";

export function useMe(enabled = true) {
  const logout = useAuthStore((s) => s.logout);

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: authService.me,
    enabled: enabled && Boolean(tokenStorage.get()),
    retry: false,
    staleTime: 5 * 60_000,
    meta: { onUnauthorized: logout },
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      navigate("/community", { replace: true });
    },
    onError: (error: Error, variables) => {
      if (error instanceof ApiRequestError && error.code === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(variables.email)}`, { replace: true });
      }
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      email,
      password,
      username,
    }: {
      email: string;
      password: string;
      username?: string;
    }) => authService.register(email, password, username),
    onSuccess: (_data, variables) => {
      navigate(`/verify-email?email=${encodeURIComponent(variables.email)}`, { replace: true });
    },
  });
}

export function useLogout() {
  const logoutStore = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    logoutStore();
    queryClient.clear();
    navigate("/login", { replace: true });
  };
}
