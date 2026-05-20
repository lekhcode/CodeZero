/**
 * Backfill usernames for all users and mark legacy email users as verified.
 * Run: npm run db:backfill:usernames
 */
import { prisma } from "../src/config/prisma.js";
import { generateUniqueUsername, usernameBaseFromEmail } from "../src/utils/username.js";

async function main(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, isEmailVerified: true, password: true, googleId: true, githubId: true },
  });

  let updated = 0;
  for (const user of users) {
    const data: { username?: string; isEmailVerified?: boolean } = {};

    if (!user.username) {
      data.username = await generateUniqueUsername(usernameBaseFromEmail(user.email));
    }

    const shouldVerify =
      !user.isEmailVerified &&
      (user.googleId !== null || user.githubId !== null || user.password !== null);
    if (shouldVerify) {
      data.isEmailVerified = true;
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data });
      updated += 1;
    }
  }

  console.log(`Backfill complete. Updated ${updated} of ${users.length} users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
