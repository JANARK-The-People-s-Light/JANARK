/**
 * Wipe all Janark data — SQLite tables + Mongo collections.
 * After this, the UI shows empty until citizens post.
 */
import "dotenv/config";
import path from "node:path";
import mongoose from "mongoose";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const filePath = dbUrl.startsWith("file:") ? dbUrl.replace(/^file:/, "") : dbUrl;
const resolved = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolved }),
});

async function clearSqlite() {
  // Order matters for FKs
  await prisma.engagementVote.deleteMany();
  await prisma.engagementComment.deleteMany();
  await prisma.contentFlag.deleteMany();
  await prisma.demandSupport.deleteMany();
  await prisma.publicDemand.deleteMany();
  await prisma.reportReaction.deleteMany();
  await prisma.reportVote.deleteMany();
  await prisma.citizenReport.deleteMany();
  await prisma.memeVote.deleteMany();
  await prisma.memeTag.deleteMany();
  await prisma.meme.deleteMany();
  await prisma.hashtag.deleteMany();
  await prisma.rateLimitBucket.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.socialShareEvent.deleteMany();
  await prisma.phoneOtp.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.phoneIdentity.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.issue.deleteMany();
  console.log("SQLite cleared");
}

async function clearMongo() {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/janark";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No mongo db");
  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    await db.dropCollection(c.name);
    console.log("Dropped mongo collection:", c.name);
  }
  await mongoose.disconnect();
  console.log("Mongo cleared");
}

async function main() {
  await clearSqlite();
  await clearMongo();
  console.log("All Janark data wiped. UI will stay empty until users post.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
