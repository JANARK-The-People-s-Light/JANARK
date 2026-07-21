-- CreateTable
CREATE TABLE "PublicDemand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ask" TEXT NOT NULL,
    "target" TEXT NOT NULL DEFAULT 'government',
    "targetDetail" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "locationLevel" TEXT NOT NULL,
    "village" TEXT,
    "town" TEXT,
    "city" TEXT,
    "block" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "authorLabel" TEXT NOT NULL DEFAULT 'Anonymous citizen',
    "authorHash" TEXT,
    "supportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DemandSupport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "demandId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandSupport_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "PublicDemand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PublicDemand_locationLevel_idx" ON "PublicDemand"("locationLevel");

-- CreateIndex
CREATE INDEX "PublicDemand_state_district_idx" ON "PublicDemand"("state", "district");

-- CreateIndex
CREATE INDEX "PublicDemand_status_supportCount_idx" ON "PublicDemand"("status", "supportCount");

-- CreateIndex
CREATE INDEX "PublicDemand_city_idx" ON "PublicDemand"("city");

-- CreateIndex
CREATE INDEX "PublicDemand_town_idx" ON "PublicDemand"("town");

-- CreateIndex
CREATE INDEX "DemandSupport_demandId_idx" ON "DemandSupport"("demandId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandSupport_demandId_voterKey_key" ON "DemandSupport"("demandId", "voterKey");
