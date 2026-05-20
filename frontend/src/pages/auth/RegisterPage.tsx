import { Alert, Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link as RouterLink } from "react-router-dom";
import { useRegister } from "@/hooks/useAuth";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { validatePassword, isValidUsernameFormat, normalizeUsername } from "@/utils/passwordPolicy";
import { useState } from "react";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    username: z.string().optional(),
    password: z.string(),
    confirm: z.string(),
  })
  .superRefine((data, ctx) => {
    const pv = validatePassword(data.password);
    if (!pv.valid) {
      for (const msg of pv.errors) {
        ctx.addIssue({ code: "custom", message: msg, path: ["password"] });
      }
    }
    if (data.password !== data.confirm) {
      ctx.addIssue({ code: "custom", message: "Passwords do not match", path: ["confirm"] });
    }
    if (data.username?.trim()) {
      const u = normalizeUsername(data.username);
      if (!isValidUsernameFormat(u)) {
        ctx.addIssue({
          code: "custom",
          message: "Username: 3–24 chars, lowercase, numbers, underscores",
          path: ["username"],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const registerMutation = useRegister();
  const [password, setPassword] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit((v) =>
        registerMutation.mutate({
          email: v.email.trim().toLowerCase(),
          password: v.password,
          username: v.username?.trim() ? normalizeUsername(v.username) : undefined,
        }),
      )}
    >
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Start learning
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Build your personalized practice OS
      </Typography>

      {registerMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {registerMutation.error.message}
        </Alert>
      )}

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
          label="Username (optional)"
          fullWidth
          {...register("username")}
          error={Boolean(errors.username)}
          helperText={errors.username?.message ?? "e.g. codezero_dev"}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          {...register("password", { onChange: (e) => setPassword(e.target.value) })}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
        />
        <PasswordStrength password={password} />
        <TextField
          label="Confirm password"
          type="password"
          fullWidth
          {...register("confirm")}
          error={Boolean(errors.confirm)}
          helperText={errors.confirm?.message}
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creating…" : "Create account"}
        </Button>
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Already have an account?{" "}
          <Link component={RouterLink} to="/login" sx={{ fontWeight: 700 }}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
