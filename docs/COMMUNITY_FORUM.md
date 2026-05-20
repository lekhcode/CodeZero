# Community Forum — Architecture

CodeZero’s community module is an isolated vertical slice for developer-focused discussions (LeetCode Discuss / Codeforces Blogs style). It does **not** share tables with compiler, judge, or schedules beyond optional `problemId` on posts for future problem threads.

## Data model

| Table | Purpose |
|-------|---------|
| `forum_posts` | Text posts + optional external link; denormalized `likeCount` / `commentCount` |
| `forum_comments` | Threaded via `parentId` (replies) |
| `forum_post_likes` | Composite PK `(userId, postId)` — no duplicate likes |
| `forum_comment_likes` | Composite PK `(userId, commentId)` |

**Post types:** `DISCUSSION`, `QUESTION`, `RESOURCE`, `GUIDE`, `INTERVIEW_EXPERIENCE`

**Future-ready:** `problemId` (nullable FK → `problems`) for per-problem discuss tabs — not wired in UI yet.

**No media in v1:** No image/video upload endpoints or storage.

## API surface (`/api/v1/forum`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/feed/hub` | Optional |
| GET | `/posts` | Optional |
| GET | `/posts/:id` | Optional |
| POST | `/posts` | Required |
| PATCH | `/posts/:id` | Author |
| DELETE | `/posts/:id` | Author |
| GET | `/posts/:id/comments` | Optional |
| POST | `/posts/:id/comments` | Required |
| POST | `/posts/:id/like` | Required |
| POST | `/comments/:id/like` | Required |

## Feed & pagination strategy

- **Ordering:** Latest = `(createdAt DESC, id DESC)`. Trending = `(likeCount DESC, commentCount DESC, createdAt DESC)` within last 14 days.
- **Pagination:** Keyset (cursor), not offset — cursor is `base64url(createdAt|id)`.
- **Why:** Stable performance at 50k+ users; avoids `OFFSET` degradation on large feeds.

## Query optimization

- Indexes on `createdAt`, `authorId`, `type`, `postId`, `(likeCount, createdAt)`.
- Denormalized counts on posts/comments — updated in transactions on like/comment create.
- Hub endpoint runs a small fixed number of parallel capped queries (6–8 items each).
- Comment list: ascending keyset per post; client builds reply tree from flat `parentId`.

## Moderation (foundation)

- Profanity word-list filter on title + body.
- Block obvious script injection patterns.
- Per-user in-process rate limits (posts / comments / likes) — replace with Redis for multi-instance.
- Link cap in post body to reduce spam.

## Scaling notes (50k users)

1. Move rate limits + optional feed cache to Redis.
2. Run hub/trending as materialized view or nightly rollup if trending query grows hot.
3. Single writer for denormalized counts is already transaction-safe; consider event queue if write volume spikes.
4. Read replicas: all GET routes are read-heavy and replica-safe.

## Seeding

```bash
npx prisma migrate deploy   # or migrate dev
npm run db:seed:forum
```

Creates 12 seed users, ~20 posts, comments, likes, and real external links (NeetCode, GFG, freeCodeCamp, MDN, system-design-primer).

## Frontend routes

- `/community` — Community Hub
- `/community/browse` — Filtered / paginated feed
- `/community/new` — Create post
- `/community/posts/:id` — Post detail + threaded comments

## Extensibility

- **Problem discussions:** Filter `GET /posts?problemId=…` when UI adds a tab on problem pages.
- **Media:** Add `ForumAttachment` table + object storage later without changing post/comment core.
- **Moderation:** Swap word-list for ML / admin flags on `ForumPost` when needed.
