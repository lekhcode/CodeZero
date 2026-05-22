# Privacy Policy — CodeZero Backend

**Effective for:** CodeZero platform backend services  
**Organization:** LoopCode  
**Created by:** Lekh Ray  
**Contact:** [whiletrue.codes@gmail.com](mailto:whiletrue.codes@gmail.com)

This policy describes how the **CodeZero backend** handles information when
you use authentication, scheduling, spaced repetition, Brain Cache, onboarding,
and related API features. The frontend application consumes these APIs; both
are part of the CodeZero product operated by LoopCode.

---

## 1. Information we process

### Account and profile

When you register or complete OAuth enrollment, we may store:

- Email address
- Username and display name
- Profile fields you provide (e.g. gender, avatar preferences where applicable)
- Authentication provider identifiers (`googleId`, `githubId` for linked accounts)
- Password hash (email/password accounts only — never plaintext)

### OAuth

If you sign in with **Google** or **GitHub**:

- We verify tokens or authorization codes **server-side**.
- We receive profile identifiers and email from the provider as permitted by
  your consent at the provider.
- We do **not** store provider access tokens for long-term API access unless
  explicitly required for a documented feature; primary use is authentication
  and account linking.

Unknown OAuth emails enter a **pending registration** flow until you complete
enrollment with chosen username/profile fields.

### Email verification and password recovery

For email/password accounts:

- We send **one-time passcodes (OTP)** via our email provider (Resend).
- OTPs are **hashed** in the database; we do not store usable plaintext codes.
- Rate limits and cooldowns apply to reduce abuse.

### Sessions

- We issue **JWT access tokens** for API authentication.
- The server stores the **current valid access token** per user to enforce a
  single active session; logging in elsewhere invalidates the previous token.
- Logout clears the stored session token.

### Learning and practice data

To power schedules, daily practice, and revision, we store:

- Schedule enrollments (`UserSchedule`) and template references
- Calendar **assignments** (problem, day, status: pending, solved, missed, skipped)
- **Submissions** and judge results (code, verdicts, timing metadata as designed)
- **Brain Cache** playlists and revision tasks (spaced repetition intervals)
- **Auto-revision** schedules derived from solves (timezone-aware)
- Streaks, leaderboard aggregates, and forum content you create
- Onboarding / first-time walkthrough flags (`firstTimeLogin`)

### Technical logs

- Structured request logs (e.g. Pino) for operations and security monitoring
- Error context for 5xx responses in non-production environments
- CORS blocked-origin warnings

We do not sell personal data.

---

## 2. How we use information

We use stored data to:

- Authenticate you and authorize API requests
- Generate daily problems and study-plan slices
- Track progress, streaks, and leaderboards
- Schedule Brain Cache and auto-revision reminders
- Deliver transactional email (verification, password reset)
- Operate the code execution and judging pipeline
- Improve reliability and investigate abuse

---

## 3. Legal basis and retention

Data is retained while your account is active and as needed for product
integrity (e.g. assignment history, submission records). You may request
account deletion by contacting **whiletrue.codes@gmail.com**; we will process
requests in line with applicable law and operational backups.

---

## 4. Third-party services

The backend integrates with services that process data under their own policies:

| Service | Purpose |
|---------|---------|
| **Google OAuth** | Sign-in and identity verification |
| **GitHub OAuth** | Sign-in and identity verification |
| **Resend** | Transactional OTP and notification email |
| **Cloudflare** | DNS, CDN, edge protection (traffic to origin) |
| **AWS (EC2)** | Application hosting |
| **PostgreSQL** | Primary data store |
| **Redis** | Job queue for isolated code execution |

We configure these integrations with least-privilege credentials stored in
environment variables, not in source control.

---

## 5. Security practices

- Secrets and keys are loaded from **environment configuration** only.
- Passwords are bcrypt-hashed; OTPs are hashed at rest.
- User code runs in **isolated Docker workers**, not in the API process.
- CORS and OAuth redirect URIs are **allowlisted**.
- Production errors avoid leaking stack traces to clients.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

---

## 6. Your choices

- Use OAuth or email registration as offered
- Log out to invalidate the current server-side session token
- Contact us to access, correct, or delete account data where applicable

---

## 7. Children

CodeZero is not directed at children under 13 (or the minimum age in your
jurisdiction). We do not knowingly collect data from children.

---

## 8. Changes

We may update this policy as the platform evolves. Material changes will be
reflected in this document; continued use after updates constitutes acceptance
of the revised policy where permitted by law.

---

## 9. Contact

**LoopCode — CodeZero**  
Privacy inquiries: [whiletrue.codes@gmail.com](mailto:whiletrue.codes@gmail.com)

---

*This document describes backend data practices for the CodeZero platform.*
