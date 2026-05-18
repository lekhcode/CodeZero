/**
 * Prisma 7 CLI needs Node >= 20.19 (ESM interop). Exit early with a clear message.
 */
const [major, minor, patch] = process.versions.node.split(".").map(Number);

function isSupported() {
  if (major > 20) return true;
  if (major === 20 && minor >= 19) return true;
  return false;
}

if (!isSupported()) {
  console.error(
    [
      "",
      "Unsupported Node.js version:",
      `  current: v${process.versions.node}`,
      "  required: v20.19.0 or newer (v22 LTS recommended)",
      "",
      "Fix:",
      "  1. Install Node 22 from https://nodejs.org",
      "  2. Or with nvm: nvm install 22 && nvm use",
      "  3. Re-open the terminal and run the command again",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
