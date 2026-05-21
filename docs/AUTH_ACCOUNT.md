# CodeZero account & authentication

Production-style account management: email OTP verification, usernames, settings, password flows, and Resend email delivery.

## Architecture

```
Client → /api/v1/auth/*  → auth.service (business rules)
                         → otp.service (OTP lifecycle)
                         → modules/email/services (templates + send)
                         → modules/email/providers/resend.provider.ts
```

Auth controllers stay thin; Resend is never called from controllers directly.

## Environment

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key (required when `EMAIL_OTP_LOG_CONSOLE=false`) |
| `EMAIL_FROM` | Sender, e.g. `CodeZero <onboarding@resend.dev>` |
| `EMAIL_OTP_LOG_CONSOLE` | `true` = log OTP to server console (default in development) |
| `OTP_EXPIRY_MINUTES` | OTP lifetime (default `10`) |
| `OTP_MAX_ATTEMPTS` | Failed verify attempts per OTP (default `5`) |
| `OTP_RESEND_COOLDOWN_SEC` | Minimum gap between sends (default `60`) |
| `OTP_RATE_LIMIT_PER_HOUR` | Max OTP rows created per user per hour (default `8`) |

## Registration flow

1. `POST /api/v1/auth/register` — creates user (`isEmailVerified: false`), assigns username, sends `VERIFY_EMAIL` OTP.
2. `POST /api/v1/auth/verify-email` — validates OTP, sets `isEmailVerified: true`, returns JWT session.
3. `POST /api/v1/auth/resend-otp` — resend verification (generic success message).

Email/password login requires `isEmailVerified`. OAuth users are created verified with an auto-generated username (no OTP).

## OAuth (Google & GitHub)

| Provider | Frontend | Backend |
|----------|----------|---------|
| Google | `VITE_GOOGLE_CLIENT_ID` + `@react-oauth/google` button | `GOOGLE_CLIENT_ID` — `POST /api/v1/auth/google` verifies id token |
| GitHub | `VITE_GITHUB_CLIENT_ID` (+ `_LOCAL` in dev) | `GITHUB_CLIENT_ID` / `SECRET` (+ `_LOCAL` in dev) |

- **Google Console:** Authorized JavaScript origins (`http://localhost:5173`, production site). Redirect URIs on the API are not used by the current flow.
- **GitHub OAuth App:** Callback URL = frontend `https://your-site/auth/github/callback` (must match `VITE_GITHUB_REDIRECT_URI` and `GITHUB_REDIRECT_URI`).
- Dev: when `GITHUB_CLIENT_ID_LOCAL` and `GITHUB_CLIENT_SECRET_LOCAL` are set, the API uses the local GitHub app automatically.

## OTP security

- 6-digit codes generated with `crypto.randomInt`.
- Only **bcrypt hashes** stored in `email_otps.otpHash`.
- Previous active OTPs for the same `(userId, type)` are deleted when a new one is issued.
- Expiry and attempt limits enforced in `otp.service.ts`.

### OTP types (`EmailOtpType`)

- `VERIFY_EMAIL` — account activation
- `RESET_PASSWORD` — forgot password
- `CHANGE_PASSWORD` — in-settings password change

## Password policy

Minimum: 8 characters, upper, lower, digit, special character. Enforced in Zod (`auth.validation.ts`) and `utils/passwordPolicy.ts`.

## Username

- Format: `^[a-z0-9_]{3,24}$`, stored lowercase.
- `GET /api/v1/users/check-username?username=` — `{ available, username }`.
- `PATCH /api/v1/users/me` — update profile fields.

Backfill existing users:

```bash
npm run db:backfill:usernames
```

## Password reset

1. `POST /api/v1/auth/forgot-password`
2. `POST /api/v1/auth/reset-password` with `{ email, code, password }`
3. `sendPasswordChangedEmail` notification

## Change password (authenticated)

1. `POST /api/v1/auth/change-password/request-otp`
2. `POST /api/v1/auth/change-password/confirm` with `{ code, password }`

## Logout

`POST /api/v1/auth/logout` clears `users.currentAccessToken` (single-session model preserved).

## Frontend routes

| Path | Page |
|------|------|
| `/register` | Sign up |
| `/verify-email` | OTP verification |
| `/login` | Sign in |
| `/forgot-password` | Request reset OTP |
| `/reset-password` | OTP + new password |
| `/settings` | Profile, security, account |

## Database

Migration: `prisma/migrations/20260523120000_account_otp_username/`

Models: `User` fields (`username`, `fullName`, `country`, `isEmailVerified`, `updatedAt`), `EmailOtp`.

## Email templates

Dark espresso-themed HTML in `src/modules/email/templates/`. Branding, OTP block, expiry note, security footer.

## Test email delivery (Postman / curl)

Set `EMAIL_TEST_SECRET` in `.env` and restart the API. The route is always at `POST /api/v1/dev/email/test`; if the env var is unset you get `503 EMAIL_TEST_NOT_CONFIGURED` instead of `404`.

**Verification template (uses Resend or console mode like production OTP):**

```bash
curl -X POST "http://localhost:3000/api/v1/dev/email/test" \
  -H "Content-Type: application/json" \
  -H "x-email-test-secret: YOUR_EMAIL_TEST_SECRET" \
  -d "{\"to\":\"you@yourdomain.com\",\"template\":\"verification\"}"
```

**Plain HTML test:**

```bash
curl -X POST "http://localhost:3000/api/v1/dev/email/test" \
  -H "Content-Type: application/json" \
  -H "x-email-test-secret: YOUR_EMAIL_TEST_SECRET" \
  -d "{\"to\":\"you@yourdomain.com\",\"template\":\"plain\",\"subject\":\"CodeZero delivery test\"}"
```

Success response includes `consoleMode` (true when `EMAIL_OTP_LOG_CONSOLE=true`) and `from` sender. For verification template, `sampleOtp` is always `123456` in the test email body (not a real account OTP).

### Resend sandbox vs verified domain

See [RESEND.md](./RESEND.md) for SDK patterns, idempotency keys, and test addresses.

If `EMAIL_FROM` uses `onboarding@resend.dev` (sandbox):

- **`to`** = your Resend account email, or Resend test inboxes like `delivered@resend.dev`
- Other addresses → `403` `RESEND_SANDBOX_RECIPIENT`

Production (signup OTP to real users):

1. Verify domain at [resend.com/domains](https://resend.com/domains)
2. `EMAIL_FROM=CodeZero <noreply@your-verified-domain.com>`
3. Restart API
