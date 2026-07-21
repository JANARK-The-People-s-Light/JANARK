-- CreateTable
CREATE TABLE "CitizenReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "locationLevel" TEXT NOT NULL,
    "village" TEXT,
    "block" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "authorLabel" TEXT NOT NULL DEFAULT 'Anonymous citizen',
    "authorHash" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReportReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportReaction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CitizenReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportVote_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CitizenReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhoneIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneHash" TEXT NOT NULL,
    "phoneHint" TEXT NOT NULL,
    "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "CitizenReport_locationLevel_idx" ON "CitizenReport"("locationLevel");

-- CreateIndex
CREATE INDEX "CitizenReport_state_district_idx" ON "CitizenReport"("state", "district");

-- CreateIndex
CREATE INDEX "CitizenReport_type_createdAt_idx" ON "CitizenReport"("type", "createdAt");

-- CreateIndex
CREATE INDEX "CitizenReport_upvotes_idx" ON "CitizenReport"("upvotes");

-- CreateIndex
CREATE INDEX "ReportReaction_reportId_idx" ON "ReportReaction"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportReaction_reportId_voterKey_reaction_key" ON "ReportReaction"("reportId", "voterKey", "reaction");

-- CreateIndex
CREATE INDEX "ReportVote_reportId_idx" ON "ReportVote"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportVote_reportId_voterKey_key" ON "ReportVote"("reportId", "voterKey");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneIdentity_phoneHash_key" ON "PhoneIdentity"("phoneHash");

-- CreateIndex
CREATE INDEX "PhoneOtp_phoneHash_idx" ON "PhoneOtp"("phoneHash");
