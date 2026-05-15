import { Alert, Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link as RouterLink } from "react-router-dom";
import { useRegister } from "@/hooks/useAuth";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "At least 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit((v) => registerMutation.mutate({ email: v.email, password: v.password }))}
    >
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Start learning
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Build your personalized practice OS
      </Typography>

      {registerMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>{registerMutation.error.message}</Alert>
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
          label="Password"
          type="password"
          fullWidth
          {...register("password")}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
        />
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
