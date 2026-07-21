-- AlterTable
ALTER TABLE "DemandSupport" ADD COLUMN "fullName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DemandSupport" ADD COLUMN "postalCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DemandSupport" ADD COLUMN "phoneHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DemandSupport" ADD COLUMN "phoneHint" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "DemandSupport_postalCode_idx" ON "DemandSupport"("postalCode");
