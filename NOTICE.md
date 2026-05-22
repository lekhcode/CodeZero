# NOTICE — CodeZero Backend Intellectual Property

```
CodeZero Backend
Schedule-driven DSA infrastructure — proprietary platform software

Copyright © LoopCode. All Rights Reserved.
Created by Lekh Ray
Organization: LoopCode
Platform: CodeZero
```

---

## Ownership

The **CodeZero backend** — including but not limited to:

- HTTP API design and `/api/v1` route architecture
- Domain modules (auth, schedules, assignments, Brain Cache, auto-revision, judge, compiler)
- Prisma schema, migrations, and data models
- Authentication flows (JWT sessions, OAuth, email OTP)
- Scheduling engine and spaced-repetition logic
- Compiler queue, Docker worker isolation, and judge pipeline
- Deployment patterns (PM2, Nginx, AWS EC2, Cloudflare integration)
- Documentation, examples, and operational scripts

—is **proprietary intellectual property owned exclusively by LoopCode**.

This is not open-source software. Viewing the repository does not grant
redistribution, commercial, or deployment rights.

---

## Permitted use

Under the [LICENSE](./LICENSE), you may:

- View and study the repository
- Inspect architecture for educational or interview evaluation
- Run locally to understand behavior (not to operate a competing service)

---

## Prohibited use

**Without prior written permission from LoopCode**, you may not:

| Prohibited action | Description |
|-------------------|-------------|
| **Redistribution** | Publishing, selling, or sharing source or binaries |
| **Commercial reuse** | Operating a paid or ad-supported clone of CodeZero |
| **Competing deployment** | Hosting a production API derived from this codebase |
| **Cloning / rebranding** | Copying modules under another product name |
| **Ownership claims** | Representing yourself as author or owner of LoopCode IP |

Violations may result in license termination and pursuit of applicable legal remedies.

---

## Trademarks

**CodeZero** and **LoopCode** are used to identify the platform and organization.
Unauthorized use of these names in connection with derivative products is prohibited.

---

## Third-party components

This backend uses open-source dependencies (Node.js ecosystem, Prisma, Express,
etc.) under their respective licenses. Those licenses govern **dependency**
code only — not LoopCode’s original application layer, schemas, or product logic.

---

## Contact

Licensing, partnership, or permission requests:

**[whiletrue.codes@gmail.com](mailto:whiletrue.codes@gmail.com)**

---

## Related governance documents

| Document | Purpose |
|----------|---------|
| [LICENSE](./LICENSE) | Legal grant and restrictions |
| [SECURITY.md](./SECURITY.md) | Vulnerability disclosure |
| [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) | Data handling |
| [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) | Acceptable use and liability |
| [README.md](./README.md) | Architecture and operations |

---

*LoopCode — engineered for production learning infrastructure.*
