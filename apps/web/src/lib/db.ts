import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Repo root = directory that contains `prisma/schema.prisma`. */
function monorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "prisma", "schema.prisma"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: apps/web → ../..
  return path.resolve(process.cwd(), "../..");
}

function resolveDatabaseUrl(raw: string): string {
  if (!raw.startsWith("file:")) return raw;
  const filePart = raw.slice("file:".length);
  if (path.isAbsolute(filePart)) return raw;
  const root = monorepoRoot();
  const abs = path.resolve(root, filePart);
  return `file:${abs}`;
}

function createPrismaClient() {
  const url = resolveDatabaseUrl(
    process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  );
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
