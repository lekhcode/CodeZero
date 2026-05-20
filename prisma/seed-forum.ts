/**
 * Seeds 22 community users + forum posts, comments, post/comment likes.
 *
 * Run with SSH tunnel open, e.g. `ssh -L 5433:127.0.0.1:5432 user@server`
 * Uses repo root `.env.seed` (port 5433 when local Postgres uses 5432).
 *
 * Re-run content when posts already exist:
 *   set SEED_FORUM_FORCE=true && npm run db:seed:forum
 *
 * Seed login password for all @community.dev users: ForumSeed!2026
 */
import bcrypt from "bcrypt";
import { loadSeedEnv } from "../scripts/load-seed-env.js";

loadSeedEnv();
import { AuthProvider, ForumPostType, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const BCRYPT_ROUNDS = 10;

type SeedUser = { email: string; name: string };
type SeedPost = {
  authorEmail: string;
  title: string;
  content: string;
  externalLink?: string;
  type: ForumPostType;
  daysAgo: number;
  likeBoost: number;
};

const USERS: SeedUser[] = [
  { email: "priya.ds@community.dev", name: "Priya Sharma" },
  { email: "arjun.codes@community.dev", name: "Arjun Mehta" },
  { email: "sneha.algo@community.dev", name: "Sneha Reddy" },
  { email: "vikram.cp@community.dev", name: "Vikram Patel" },
  { email: "ananya.interview@community.dev", name: "Ananya Iyer" },
  { email: "rohan.graphs@community.dev", name: "Rohan Das" },
  { email: "meera.faang@community.dev", name: "Meera Nair" },
  { email: "karan.dp@community.dev", name: "Karan Singh" },
  { email: "divya.guide@community.dev", name: "Divya Krishnan" },
  { email: "amit.system@community.dev", name: "Amit Joshi" },
  { email: "nisha.bs@community.dev", name: "Nisha Gupta" },
  { email: "rahul.roadmap@community.dev", name: "Rahul Verma" },
  { email: "tanya.heap@community.dev", name: "Tanya Kapoor" },
  { email: "leo.stacks@community.dev", name: "Leo Fernandez" },
  { email: "isha.trees@community.dev", name: "Isha Menon" },
  { email: "dev.patterns@community.dev", name: "Dev Malhotra" },
  { email: "zara.greedy@community.dev", name: "Zara Khan" },
  { email: "omkar.backtrack@community.dev", name: "Omkar Rao" },
  { email: "lisa.trie@community.dev", name: "Lisa Chen" },
  { email: "harsh.mock@community.dev", name: "Harsh Agarwal" },
  { email: "maya.revision@community.dev", name: "Maya Bose" },
  { email: "yash.contest@community.dev", name: "Yash Pillai" },
];

function usernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  return local.replace(/\./g, "_").toLowerCase();
}

const POSTS: SeedPost[] = [
  {
    authorEmail: "karan.dp@community.dev",
    title: "How I finally understood Dynamic Programming",
    type: ForumPostType.GUIDE,
    daysAgo: 2,
    likeBoost: 42,
    externalLink: "https://neetcode.io/roadmap",
    content:
      "For months I memorized recurrence relations without intuition. What clicked:\n\n1. Define state in plain English first\n2. Draw the recursion tree for a tiny input\n3. Spot overlapping subproblems\n4. Only then write the transition\n\nI rewrote 15 classics (climbing stairs → LCS) using this order. Happy to share my notion template.",
  },
  {
    authorEmail: "ananya.interview@community.dev",
    title: "Amazon SDE-1 interview experience (offer)",
    type: ForumPostType.INTERVIEW_EXPERIENCE,
    daysAgo: 1,
    likeBoost: 67,
    content:
      "Round 1: OA — 2 medium DSA + debugging.\nRound 2: Phone — binary search variant on answer.\nRound 3: Virtual onsite — LRU cache design + two-pointer.\nRound 4: Bar raiser — leadership + tradeoffs on caching.\n\nTips: narrate complexity early, ask clarifying questions, and keep a pattern checklist.",
  },
  {
    authorEmail: "nisha.bs@community.dev",
    title: "Binary Search patterns explained (with templates)",
    type: ForumPostType.GUIDE,
    daysAgo: 3,
    likeBoost: 55,
    externalLink: "https://www.geeksforgeeks.org/binary-search/",
    content:
      "Three families I use daily:\n• Classic index search\n• Search on answer (minimize maximum)\n• Boundary search (first true in monotonic predicate)\n\nTemplate in Python/Java in comments welcome — I'll pin the cleanest one.",
  },
  {
    authorEmail: "rohan.graphs@community.dev",
    title: "Best Graph learning resources?",
    type: ForumPostType.QUESTION,
    daysAgo: 0,
    likeBoost: 28,
    externalLink: "https://www.freecodecamp.org/news/graph-algorithms-for-beginners/",
    content:
      "Finished BFS/DFS but struggling with Dijkstra and topological sort intuition. What helped you — visualizations, a specific playlist, or problem sets?",
  },
  {
    authorEmail: "amit.system@community.dev",
    title: "System Design roadmap for beginners",
    type: ForumPostType.RESOURCE,
    daysAgo: 4,
    likeBoost: 38,
    externalLink: "https://github.com/donnemartin/system-design-primer",
    content:
      "Curated path I give juniors:\nWeek 1–2: networking + HTTP + caching\nWeek 3: SQL vs NoSQL tradeoffs\nWeek 4: queues, load balancers, CAP\nWeek 5+: mock designs (URL shortener, feed, chat).",
  },
  {
    authorEmail: "priya.ds@community.dev",
    title: "Two-pointer vs sliding window — when to use which?",
    type: ForumPostType.DISCUSSION,
    daysAgo: 5,
    likeBoost: 31,
    content:
      "Both feel similar on substring problems. My rule: fixed window size → sliding window; pair sum on sorted array → two pointers. Counterexamples welcome.",
  },
  {
    authorEmail: "sneha.algo@community.dev",
    title: "NeetCode 150 — week 6 check-in",
    type: ForumPostType.DISCUSSION,
    daysAgo: 6,
    likeBoost: 22,
    externalLink: "https://neetcode.io/practice",
    content:
      "Just wrapped trees. Graphs next week feels intimidating. Anyone pairing up for daily accountability?",
  },
  {
    authorEmail: "meera.faang@community.dev",
    title: "Google L3 loop — what surprised me",
    type: ForumPostType.INTERVIEW_EXPERIENCE,
    daysAgo: 7,
    likeBoost: 49,
    content:
      "They cared more about clean communication than optimal code on one round. Another round was pure graph BFS with a twist on state. No trick questions — but tight on edge cases.",
  },
  {
    authorEmail: "rahul.roadmap@community.dev",
    title: "6-month DSA study roadmap (working professional)",
    type: ForumPostType.GUIDE,
    daysAgo: 8,
    likeBoost: 44,
    externalLink: "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms/",
    content:
      "Month 1–2: arrays, hash maps, two pointers\nMonth 3: stacks, queues, binary search\nMonth 4: trees + graphs\nMonth 5: DP\nMonth 6: mocks + system design lite",
  },
  {
    authorEmail: "vikram.cp@community.dev",
    title: "Why I keep failing timed contests",
    type: ForumPostType.QUESTION,
    daysAgo: 2,
    likeBoost: 19,
    content:
      "I solve the same problems untimed but panic under 25 minutes. Breathing exercises helped a bit. What mental models worked for you on Codeforces/LeetCode contests?",
  },
  {
    authorEmail: "divya.guide@community.dev",
    title: "Union-Find template + path compression cheatsheet",
    type: ForumPostType.RESOURCE,
    daysAgo: 9,
    likeBoost: 36,
    externalLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    content:
      "Posting my annotated template for disjoint set — used in Kruskal, grid connectivity, and dynamic connectivity. Ask if you want the Java port.",
  },
  {
    authorEmail: "arjun.codes@community.dev",
    title: "Monotonic stack problems — curated list",
    type: ForumPostType.RESOURCE,
    daysAgo: 10,
    likeBoost: 27,
    externalLink: "https://www.geeksforgeeks.org/monotonic-stack/",
    content:
      "Daily temperatures, largest rectangle in histogram, next greater element — all the same skeleton. I grouped 12 problems by variant.",
  },
  {
    authorEmail: "karan.dp@community.dev",
    title: "Memoization vs tabulation — memory tradeoffs",
    type: ForumPostType.DISCUSSION,
    daysAgo: 11,
    likeBoost: 24,
    content:
      "Top-down is faster to write; bottom-up often saves stack depth and can be space-optimized. When do you default to each?",
  },
  {
    authorEmail: "ananya.interview@community.dev",
    title: "Microsoft SDE intern — OA + interview breakdown",
    type: ForumPostType.INTERVIEW_EXPERIENCE,
    daysAgo: 12,
    likeBoost: 33,
    content:
      "OA: array + string. Interviews: one easy warm-up, one medium graph. Behavioral: project deep dive. Study arrays and graphs heavily.",
  },
  {
    authorEmail: "nisha.bs@community.dev",
    title: "Understanding recursion before DP",
    type: ForumPostType.GUIDE,
    daysAgo: 3,
    likeBoost: 29,
    externalLink: "https://www.freecodecamp.org/news/recursion-in-javascript/",
    content:
      "If you can't write the recursive solution, tabulation will feel like magic. Practice: fibonacci, subsets, permutations, then move to knapsack.",
  },
  {
    authorEmail: "rohan.graphs@community.dev",
    title: "Dijkstra vs BFS — when weights matter",
    type: ForumPostType.DISCUSSION,
    daysAgo: 4,
    likeBoost: 21,
    content:
      "Seen people run BFS on weighted graphs and get WA. Rule: non-negative weights → Dijkstra; unweighted → BFS. Bellman-Ford for negative edges.",
  },
  {
    authorEmail: "amit.system@community.dev",
    title: "Rate limiter design — interview notes",
    type: ForumPostType.GUIDE,
    daysAgo: 13,
    likeBoost: 40,
    content:
      "Token bucket vs sliding window log. Discuss Redis, clock skew, and hot keys. I sketched APIs: allow(), remaining(), reset().",
  },
  {
    authorEmail: "priya.ds@community.dev",
    title: "Best practices for reading editorial without cheating growth",
    type: ForumPostType.QUESTION,
    daysAgo: 1,
    likeBoost: 18,
    content:
      "I peek after 35 minutes. Trying a 'two attempts' rule. How do you balance learning vs dependency on solutions?",
  },
  {
    authorEmail: "sneha.algo@community.dev",
    title: "Trie problems that actually appear in interviews",
    type: ForumPostType.RESOURCE,
    daysAgo: 14,
    likeBoost: 26,
    externalLink: "https://www.geeksforgeeks.org/trie-insert-and-search/",
    content:
      "Word search II, design add/search words, longest word in dictionary. Implementation tips: map vs array children, end-of-word flag.",
  },
  {
    authorEmail: "meera.faang@community.dev",
    title: "Burnout after 200 problems — how I recovered",
    type: ForumPostType.DISCUSSION,
    daysAgo: 15,
    likeBoost: 52,
    content:
      "Took 10 days off contests. Switched to 1 hard + 1 review daily. Sleep and walks > extra hours grinding. Community accountability helped.",
  },
];

const COMMENT_SNIPPETS = [
  "This is gold — saving for my revision week.",
  "Same experience in my Meta loop last month.",
  "Can you share the Python template?",
  "Would add segment trees as a follow-up topic.",
  "The roadmap section is super practical.",
  "I used the NeetCode path and it aligned well.",
  "Try drawing the state machine before coding.",
  "Bookmarked — thanks for the real links!",
];

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9 + (days % 8), 15, 0, 0);
  return d;
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("ForumSeed!2026", BCRYPT_ROUNDS);
  const userByEmail = new Map<string, string>();

  for (const u of USERS) {
    const username = usernameFromEmail(u.email);
    const row = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        name: u.name,
        username,
        fullName: u.name,
        provider: AuthProvider.EMAIL,
        password: passwordHash,
        isEmailVerified: true,
      },
      update: {
        name: u.name,
        fullName: u.name,
        isEmailVerified: true,
      },
    });
    userByEmail.set(u.email, row.id);
  }

  console.log(`Upserted ${USERS.length} seed users (password: ForumSeed!2026).`);

  const forceSeed = process.env["SEED_FORUM_FORCE"] === "true";
  const existingCount = await prisma.forumPost.count();
  if (!forceSeed && existingCount >= 10) {
    console.log(
      `Forum already has ${existingCount} posts — skipping content seed. Set SEED_FORUM_FORCE=true to add anyway.`,
    );
    return;
  }

  const postIds: string[] = [];

  for (const p of POSTS) {
    const authorId = userByEmail.get(p.authorEmail);
    if (authorId === undefined) continue;

    const createdAt = daysAgoDate(p.daysAgo);
    const post = await prisma.forumPost.create({
      data: {
        authorId,
        title: p.title,
        content: p.content,
        externalLink: p.externalLink ?? null,
        type: p.type,
        likeCount: p.likeBoost,
        commentCount: 0,
        createdAt,
        updatedAt: createdAt,
      },
    });
    postIds.push(post.id);

    const commentCount = 2 + (p.daysAgo % 4);
    for (let c = 0; c < commentCount; c += 1) {
      const commentAuthor =
        USERS[(c + p.daysAgo) % USERS.length]!;
      const commentAuthorId = userByEmail.get(commentAuthor.email)!;
      const comment = await prisma.forumComment.create({
        data: {
          postId: post.id,
          authorId: commentAuthorId,
          content: COMMENT_SNIPPETS[(c + p.daysAgo) % COMMENT_SNIPPETS.length]!,
          likeCount: 1 + (c % 5),
          createdAt: new Date(createdAt.getTime() + (c + 1) * 3600_000),
        },
      });

      const commentLikers = USERS.filter((_, i) => (i + c + p.daysAgo) % 4 !== 0).slice(0, 4);
      for (const liker of commentLikers) {
        const likerId = userByEmail.get(liker.email)!;
        await prisma.forumCommentLike
          .create({
            data: { userId: likerId, commentId: comment.id },
          })
          .catch(() => undefined);
      }
    }

    await prisma.forumPost.update({
      where: { id: post.id },
      data: { commentCount },
    });

    const likers = USERS.filter((_, i) => (i + p.daysAgo) % 3 !== 0).slice(0, 6);
    for (const liker of likers) {
      const likerId = userByEmail.get(liker.email)!;
      await prisma.forumPostLike
        .create({
          data: { userId: likerId, postId: post.id },
        })
        .catch(() => undefined);
    }
  }

  const [userCount, postCount, commentCount, postLikeCount, commentLikeCount] =
    await Promise.all([
      prisma.user.count({ where: { email: { endsWith: "@community.dev" } } }),
      prisma.forumPost.count(),
      prisma.forumComment.count(),
      prisma.forumPostLike.count(),
      prisma.forumCommentLike.count(),
    ]);

  console.log(
    `Seeded ${postIds.length} forum posts with comments and likes. Totals: users@${String(userCount)} posts=${String(postCount)} comments=${String(commentCount)} postLikes=${String(postLikeCount)} commentLikes=${String(commentLikeCount)}`,
  );
}

void main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
