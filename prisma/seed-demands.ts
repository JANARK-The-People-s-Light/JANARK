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

async function main() {
  const samples = [
    {
      title: "Restore 24x7 drinking water in ward 12",
      ask: "Guarantee tanker supply within 48 hours and fix the main pipeline leak.",
      body: "Families have had intermittent supply for three weeks. Schools are sending children home with empty bottles.",
      target: "district",
      targetDetail: "Municipal corporation",
      category: "infrastructure",
      status: "gathering",
      locationLevel: "city",
      city: "Indore",
      district: "Indore",
      state: "Madhya Pradesh",
      country: "India",
      authorLabel: "Anonymous citizen",
      supportCount: 482,
    },
    {
      title: "Transparent NEET re-exam timeline",
      ask: "Publish a fixed national re-exam calendar and independent audit report within 30 days.",
      body: "Students need certainty. Delays and opaque process destroy a year of preparation.",
      target: "government",
      targetDetail: "Ministry of Education / NTA",
      category: "education",
      status: "gathering",
      locationLevel: "national",
      country: "India",
      authorLabel: "Anonymous citizen",
      supportCount: 12040,
    },
    {
      title: "Night police patrol near town bus stand",
      ask: "Deploy nightly patrol and fix street lighting within 15 days.",
      body: "Snatching incidents after dark have risen. Women workers returning late feel unsafe.",
      target: "district",
      targetDetail: "SP office",
      category: "justice",
      status: "gathering",
      locationLevel: "town",
      town: "Sitapur",
      district: "Sitapur",
      state: "Uttar Pradesh",
      country: "India",
      authorLabel: "Anonymous citizen",
      supportCount: 219,
    },
  ];

  for (const s of samples) {
    const exists = await prisma.publicDemand.findFirst({
      where: { title: s.title },
    });
    if (!exists) await prisma.publicDemand.create({ data: s });
  }
  console.log("Public demands seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
