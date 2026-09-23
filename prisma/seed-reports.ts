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

const samples = [
  {
    type: "problem",
    title: "AQI stays hazardous — construction dust unenforced at site",
    body: "Uncovered debris and no night watering near an active corridor. Request municipal enforcement.",
    locationLevel: "city",
    city: "Delhi",
    district: "South Delhi",
    state: "Delhi",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
  },
  {
    type: "problem",
    title: "Primary health centre out of essential medicines for a week",
    body: "Patients redirected to private chemists for basic antibiotics and ORS.",
    locationLevel: "district",
    district: "Nashik",
    state: "Maharashtra",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
  },
  {
    type: "issue",
    title: "Entrance exam centre — no transparent grievance desk",
    body: "Aspirants waited without a published escalation path after a glitch rumour.",
    locationLevel: "city",
    city: "Patna",
    district: "Patna",
    state: "Bihar",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
  },
  {
    type: "problem",
    title: "Legacy dump leachate after rains near housing colony",
    body: "Monsoon runoff from an old dump floods lanes. Request scientific processing.",
    locationLevel: "city",
    city: "Mumbai",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
  },
  {
    type: "problem",
    title: "No continuous water — tanker rates opaque in summer",
    body: "Alternate-day supply forces opaque tanker markets. Need public rate boards.",
    locationLevel: "city",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    country: "India",
    authorLabel: "Anonymous citizen",
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
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
  console.log("Seeded", samples.length, "citizen reports (0 upvotes)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
