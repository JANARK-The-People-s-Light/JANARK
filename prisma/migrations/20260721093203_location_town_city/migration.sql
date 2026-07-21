-- AlterTable
ALTER TABLE "CitizenReport" ADD COLUMN "city" TEXT;
ALTER TABLE "CitizenReport" ADD COLUMN "town" TEXT;

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN "city" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "country" TEXT DEFAULT 'India';
ALTER TABLE "Proposal" ADD COLUMN "district" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "locationLevel" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "state" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "town" TEXT;

-- CreateIndex
CREATE INDEX "CitizenReport_city_idx" ON "CitizenReport"("city");

-- CreateIndex
CREATE INDEX "CitizenReport_town_idx" ON "CitizenReport"("town");
