# Security Policy — CodeZero Backend

**Platform:** CodeZero  
**Organization:** LoopCode  
**Maintained by:** LoopCode — Created by Lekh Ray

---

## Reporting a vulnerability

LoopCode takes security seriously. If you believe you have found a
vulnerability in the CodeZero backend, please report it responsibly.

**Do not** open a public GitHub issue for security-sensitive findings.

### How to report

1. Email **whiletrue.codes@gmail.com** with the subject line:
   `Security — CodeZero Backend`.
2. Include a clear description of the issue, affected components
   (auth, OAuth, compiler worker, API routes, etc.), and steps to reproduce
   if applicable.
3. Allow reasonable time for triage before public disclosure.

We aim to acknowledge reports within **5 business days** and will work with
you on validation and remediation where appropriate.

### What we appreciate

- Proof-of-concept that demonstrates impact without harming users
- Suggested fix or mitigation when you have one
- Responsible coordination — no data exfiltration, no destructive testing
  against production systems without explicit written approval

### Out of scope (generally)

- Social engineering or phishing against individuals
- Denial-of-service attacks against production infrastructure
- Issues in third-party services (Google, GitHub, Cloudflare, AWS) unless
  they stem from our integration misuse
- Missing security headers on static frontend assets not served by this API

---

## Security contact

| Role | Contact |
|------|---------|
| Security reports | [whiletrue.codes@gmail.com](mailto:whiletrue.codes@gmail.com) |
| General / legal | [whiletrue.codes@gmail.com](mailto:whiletrue.codes@gmail.com) |

---

## Security philosophy

CodeZero’s backend is designed as a **multi-tenant learning platform**, not a
demo API. Security is treated as a product requirement, not an afterthought.

### Authentication and sessions

- **JWT access tokens** are signed with a server-side secret (`JWT_SECRET`).
  Tokens are validated on every protected request.
- **Single active session:** the raw Bearer token must match the value stored
  on the user record (`currentAccessToken`). A new login invalidates prior
  tokens without maintaining a separate refresh-token table.
- **Email verification** is enforced for password-based accounts before
  protected routes succeed.
- **Passwords** are hashed with bcrypt; plaintext passwords are never stored.

### OAuth

- **Google:** ID tokens are verified server-side; client IDs come from
  environment configuration only.
- **GitHub:** authorization-code flow with a **redirect URI allowlist** —
  callbacks must match configured production or development URIs.
- **Pending registration:** unknown OAuth identities receive a short-lived
  signed `pendingToken` and must complete registration explicitly — no
  orphan OAuth rows without enrollment.

### Email OTP

- OTP codes are **hashed at rest**; plaintext OTPs are not persisted.
- Resend cooldowns, hourly rate limits, and attempt tracking reduce abuse.
- Delivery uses Resend in production; API keys live in environment variables
  only.

### API edge

- **CORS** uses an explicit origin allowlist (`CORS_ORIGIN`, `FRONTEND_URL`).
- **Payload limits** (`express.json` cap) reduce abuse surface.
- **`x-powered-by`** is disabled to avoid trivial fingerprinting.
- Validation runs at route boundaries (**Zod**) before business logic executes.

### Code execution isolation

User-submitted code **never runs inside the API process**. Submissions are
queued (**BullMQ** + **Redis**) and executed by a separate **compiler worker**
inside **Docker** with configurable memory, CPU, and PID limits.

### Environment and secrets

- Required secrets are validated at **boot** (`config/env.ts` fails fast).
- **Never commit** `.env`, production keys, OAuth client secrets, JWT secrets,
  database credentials, or Resend API keys.
- Use `.env.example` as the reference surface — placeholders only.
- Production deploys should inject secrets via the host environment or a
  secrets manager, not baked into artifacts.

### Infrastructure mindset

Production assumes **defense in depth**:

| Layer | Role |
|-------|------|
| **Cloudflare** | Edge DNS, CDN, DDoS/WAF mitigation in front of origin |
| **Nginx** | TLS termination, reverse proxy, request sizing at the edge |
| **PM2** | Process supervision; API pinned to one instance for cron safety |
| **PostgreSQL** | System of record — auth state, schedules, assignments |
| **Redis** | Queue backing store — not a source of user secrets |

Operators should restrict SSH, database, and Redis ports to trusted networks,
keep dependencies patched (`npm audit`), and run `prisma migrate deploy` before
restarting production processes.

---

## Supported versions

Security fixes are applied to the **current production deployment** of
CodeZero maintained by LoopCode. There is no separate LTS branch published
in this repository; refer to the main branch and active deployment tags.

---

## Recognition

We welcome coordinated disclosure and will credit researchers in release notes
or security advisories when they agree to responsible publication timing.

---

*LoopCode — CodeZero Backend — security is part of the architecture.*
