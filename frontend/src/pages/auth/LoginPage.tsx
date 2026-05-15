import { Alert, Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const location = useLocation();
  const registered = (location.state as { registered?: boolean } | null)?.registered;
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Box component="form" onSubmit={handleSubmit((v) => login.mutate(v))}>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Welcome back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Continue your learning streak
      </Typography>

      {registered && <Alert severity="success" sx={{ mb: 2 }}>Account created — sign in to continue.</Alert>}
      {login.isError && <Alert severity="error" sx={{ mb: 2 }}>{login.error.message}</Alert>}

      <Stack spacing={2}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          {...register("email")}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          {...register("password")}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          New here?{" "}
          <Link component={RouterLink} to="/register" sx={{ fontWeight: 700 }}>
            Create account
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
