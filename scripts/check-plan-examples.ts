import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main() {
  for (const slug of ["blind-75", "top-interview-150"]) {
    const t = await prisma.scheduleTemplate.findUnique({
      where: { slug },
      include: {
        templateProblems: {
          orderBy: { order: "asc" },
          include: { problem: { select: { slug: true, rawContent: true, examples: true } } },
        },
      },
    });
    if (!t) { console.log(slug, "template missing"); continue; }
    if (t.templateProblems.length === 0) {
      console.log(slug, "NO template_problems — run sync script");
      continue;
    }
    let noRaw = 0, noOutput = 0, ok = 0;
    for (const tp of t.templateProblems) {
      const p = tp.problem;
      const ex = Array.isArray(p.examples) ? p.examples : [];
      const hasOut = ex.some((e) => e && typeof e === "object" && String(e.output ?? "").trim());
      if (!p.rawContent?.trim()) noRaw++;
      else if (!hasOut) noOutput++;
      else ok++;
    }
    console.log(slug, "linked", t.templateProblems.length, "ok", ok, "noRaw", noRaw, "noOutput", noOutput);
  }
}
main().finally(() => prisma.$disconnect());
