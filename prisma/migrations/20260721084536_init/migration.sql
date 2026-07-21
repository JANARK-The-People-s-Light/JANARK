-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "currentSituation" TEXT NOT NULL,
    "pros" TEXT NOT NULL,
    "cons" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "relatedSlugs" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "trendingRank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "argumentsFor" TEXT NOT NULL,
    "argumentsAgainst" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "options" TEXT,
    "results" TEXT,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "issueSlug" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_issueSlug_fkey" FOREIGN KEY ("issueSlug") REFERENCES "Issue" ("slug") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetDetail" TEXT,
    "author" TEXT NOT NULL,
    "category" TEXT,
    "signatures" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noticeId" TEXT NOT NULL,
    "signerKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Signature_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueSlug" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_issueSlug_fkey" FOREIGN KEY ("issueSlug") REFERENCES "Issue" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialShareEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_slug_key" ON "Issue"("slug");

-- CreateIndex
CREATE INDEX "Vote_proposalId_idx" ON "Vote"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_proposalId_voterKey_key" ON "Vote"("proposalId", "voterKey");

-- CreateIndex
CREATE INDEX "Signature_noticeId_idx" ON "Signature"("noticeId");

-- CreateIndex
CREATE UNIQUE INDEX "Signature_noticeId_signerKey_key" ON "Signature"("noticeId", "signerKey");

-- CreateIndex
CREATE INDEX "Comment_issueSlug_idx" ON "Comment"("issueSlug");

-- CreateIndex
CREATE INDEX "SocialShareEvent_platform_idx" ON "SocialShareEvent"("platform");
