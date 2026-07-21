import "dotenv/config";
import path from "node:path";
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

const samples = [
  {
    type: "crime",
    title: "Night thefts near bus stand",
    body: "Multiple phone snatching incidents after 9pm. Street lights not working for two weeks.",
    locationLevel: "village",
    village: "Rampur",
    district: "Nalanda",
    state: "Bihar",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 42,
  },
  {
    type: "problem",
    title: "No drinking water for 4 days",
    body: "Handpump dry; tanker not arriving. Families walking 2km.",
    locationLevel: "village",
    village: "Kheda",
    block: "Sanand",
    district: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 128,
  },
  {
    type: "issue",
    title: "School mid-day meal quality",
    body: "Children reporting undercooked food. Need inspection.",
    locationLevel: "district",
    district: "Mysuru",
    state: "Karnataka",
    country: "India",
    authorLabel: "Parent group",
    upvotes: 67,
  },
  {
    type: "problem",
    title: "Potholes on NH stretch causing accidents",
    body: "Three accidents this month near the toll.",
    locationLevel: "state",
    state: "Maharashtra",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 210,
  },
  {
    type: "crime",
    title: "Open gambling den complaint ignored",
    body: "Complaints to local chowki unanswered for a month.",
    locationLevel: "block",
    block: "Kotwali",
    district: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 55,
  },
];

async function main() {
  const count = await prisma.citizenReport.count();
  if (count > 0) {
    console.log("Reports already present:", count);
    return;
  }
  for (const s of samples) {
    await prisma.citizenReport.create({ data: s });
  }
  console.log("Seeded", samples.length, "citizen reports");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
