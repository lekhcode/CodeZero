# Terms of Service — CodeZero Backend / Platform API

**Organization:** LoopCode  
**Platform:** CodeZero  
**Created by:** Lekh Ray  
**Contact:** [whiletrue.codes@gmail.com](mailto:whiletrue.codes@gmail.com)

These Terms govern use of the **CodeZero backend API and related infrastructure**
operated by LoopCode. By creating an account, calling the API, or using features
powered by this backend (schedules, Brain Cache, judge, OAuth login, etc.), you
agree to these Terms.

---

## 1. The service

CodeZero provides a structured data-structures-and-algorithms learning platform,
including:

- Schedule-driven daily practice and study plans
- Spaced repetition (Brain Cache, auto-revision)
- Code submission and judging
- Progress tracking, forums, and leaderboards
- Authentication via email/password and OAuth (Google, GitHub)

The backend is proprietary software owned by LoopCode. See [LICENSE](./LICENSE)
and [NOTICE.md](./NOTICE.md).

---

## 2. Eligibility and accounts

- You must provide accurate registration information.
- You are responsible for safeguarding your credentials and active sessions.
- You must not share accounts in ways that circumvent rate limits, judging
  fairness, or leaderboard integrity.
- LoopCode may suspend or terminate accounts that violate these Terms.

---

## 3. Acceptable use

You agree **not** to:

- Abuse authentication (credential stuffing, session hijacking attempts, OTP spam)
- Bypass rate limits, CORS, or OAuth redirect protections
- Reverse-engineer or scrape the API at volumes that impair service for others
- Upload malicious code intended to compromise workers, hosts, or other users
- Harass others via forum or profile features
- Misrepresent affiliation with LoopCode or CodeZero
- Use the API to build a competing product without written permission from LoopCode

Educational inspection of this repository’s architecture is permitted under the
[LICENSE](./LICENSE); **commercial reuse, redistribution, and competing deployments
are prohibited.**

---

## 4. API use restrictions

- Client applications must use documented `/api/v1` endpoints and respect
  validation and error contracts.
- Automated access must not degrade availability for other users (no unbounded
  polling, catalog dumping without authorization, or judge flooding).
- Administrative or catalog dump routes require configured secrets or valid JWT
  as documented — unauthorized dump access is prohibited.
- You may not remove or forge security headers, tokens, or user identity claims.

---

## 5. User content and submissions

You retain rights to code you submit for judging. You grant LoopCode a license
to store, execute (in isolated sandboxes), and display results as needed to
operate the product (verdicts, timing, assignment linkage).

You represent that your submissions do not violate third-party rights or law.

---

## 6. Intellectual property

All backend source, schemas, API design, deployment topology, and documentation
are **exclusive property of LoopCode**.

- The CodeZero name and LoopCode branding may not be used without permission.
- No ownership rights transfer to users or viewers of this repository.
- Cloning, rebranding, or commercial deployment of this backend without written
  consent is prohibited.

---

## 7. Platform limitations

The service is provided on a best-effort basis:

- Practice schedules, POTD sync, and revision calendars depend on cron jobs,
  external problem metadata, and correct timezone configuration.
- Judge and compiler results depend on worker capacity, Docker availability,
  and language runtime constraints.
- Email delivery depends on third-party providers and verified sender domains.
- Features marked pending or unavailable in API responses may ship later without
  prior notice.

LoopCode does not guarantee uninterrupted access, perfect judge outcomes, or
fitness for a particular interview outcome.

---

## 8. Disclaimer of warranties

TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE AND API ARE PROVIDED **"AS IS"**
WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

---

## 9. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOOPCODE AND LEKH RAY SHALL NOT BE LIABLE
FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.

OUR AGGREGATE LIABILITY FOR DIRECT DAMAGES SHALL NOT EXCEED THE GREATER OF (A)
AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR
(B) ONE HUNDRED U.S. DOLLARS (USD $100), WHERE PERMITTED BY LAW.

Some jurisdictions do not allow certain limitations; in those cases, limitations
apply only to the extent allowed.

---

## 10. Indemnification

You agree to indemnify LoopCode against claims arising from your misuse of the
API, violation of these Terms, or infringement of third-party rights through
your content or conduct.

---

## 11. Modifications

We may update these Terms or the API. Continued use after changes constitutes
acceptance where permitted by law. Material changes may be communicated via the
product or repository documentation.

---

## 12. Governing contact

Questions about these Terms:

**whiletrue.codes@gmail.com**

---

## 13. Related documents

- [LICENSE](./LICENSE) — proprietary use restrictions
- [NOTICE.md](./NOTICE.md) — intellectual property notice
- [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) — data handling
- [SECURITY.md](./SECURITY.md) — vulnerability reporting

---

*LoopCode — CodeZero — Terms of Service*
