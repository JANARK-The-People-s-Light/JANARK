/**
 * Clear only RateLimitBucket rows (OTP / write throttles).
 * Does not wipe civic content — use `npm run db:clear` for a full wipe.
 *
 * Local:  npm run db:clear-rate-limits
 * Docker (as nextjs, after entrypoint chown):
 *   docker compose exec -u nextjs app node --input-type=module -e \
 *     'import Database from "better-sqlite3"; const db=new Database("/data/janark.db"); console.log(db.prepare("DELETE FROM RateLimitBucket").run().changes);'
 *
 * Do not `docker cp` into /data as root — wrong UID causes SQLITE_READONLY.
 */
import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../apps/web/src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const filePath = dbUrl.startsWith("file:") ? dbUrl.replace(/^file:/, "") : dbUrl;
const resolved = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolved }),
});

async function main() {
  const result = await prisma.rateLimitBucket.deleteMany();
  console.log(`Cleared ${result.count} RateLimitBucket row(s) from ${resolved}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
