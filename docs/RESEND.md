# Resend email (CodeZero)

Aligned with the [Resend Node.js SDK](https://resend.com/docs) — see project guardrails in your Resend skill doc.

## Setup

1. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
2. Verify your domain at [resend.com/domains](https://resend.com/domains)
3. In `.env`:

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=CodeZero <noreply@your-verified-domain.com>
EMAIL_OTP_LOG_CONSOLE=false
```

`RESEND_API_KEY` is read by `src/modules/email/providers/resend.provider.ts` via `new Resend(env.RESEND_API_KEY)`.

**Do not** use `onboarding@resend.dev` in production — it is test-only and restricts recipients.

## SDK usage in this repo

- Import: `import { Resend } from "resend"`
- Send: `const { data, error } = await resend.emails.send({ ... })`
- Errors are checked from `error`, not `try/catch` around send (network failures may still throw)
- Parameters use **camelCase**: `replyTo`, `idempotencyKey`, `scheduledAt`
- OTP sends include **idempotencyKey**: `verify-email/{userId}/{otpId}` (safe retries)
- OTP sends include **tags**: `type`, `user_id`

## Resend test addresses (no domain reputation risk)

| Address | Simulates |
|---------|-----------|
| `delivered@resend.dev` | Successful delivery |
| `bounced@resend.dev` | Bounce |
| `complained@resend.dev` | Spam complaint |
| `suppressed@resend.dev` | Suppressed |

Use with sandbox `from` (`onboarding@resend.dev`) in Postman:

```json
{ "to": "delivered@resend.dev", "template": "verification" }
```

## Postman test endpoint

```bash
curl -X POST "http://localhost:2026/api/v1/dev/email/test" \
  -H "Content-Type: application/json" \
  -H "x-email-test-secret: YOUR_EMAIL_TEST_SECRET" \
  -d "{\"to\":\"delivered@resend.dev\",\"template\":\"verification\"}"
```

Response includes `resendEmailId` when send succeeds.

## Account OTP flows

See [AUTH_ACCOUNT.md](./AUTH_ACCOUNT.md) for register → verify → login.
