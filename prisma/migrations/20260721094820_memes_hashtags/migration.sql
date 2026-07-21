-- CreateTable
CREATE TABLE "Meme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "imageUrl" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "authorLabel" TEXT NOT NULL DEFAULT 'Anonymous citizen',
    "authorHash" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MemeTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memeId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    CONSTRAINT "MemeTag_memeId_fkey" FOREIGN KEY ("memeId") REFERENCES "Meme" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemeTag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemeVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memeId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemeVote_memeId_fkey" FOREIGN KEY ("memeId") REFERENCES "Meme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Meme_createdAt_idx" ON "Meme"("createdAt");

-- CreateIndex
CREATE INDEX "Meme_upvotes_idx" ON "Meme"("upvotes");

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_tag_key" ON "Hashtag"("tag");

-- CreateIndex
CREATE INDEX "Hashtag_tag_idx" ON "Hashtag"("tag");

-- CreateIndex
CREATE INDEX "MemeTag_hashtagId_idx" ON "MemeTag"("hashtagId");

-- CreateIndex
CREATE INDEX "MemeTag_memeId_idx" ON "MemeTag"("memeId");

-- CreateIndex
CREATE UNIQUE INDEX "MemeTag_memeId_hashtagId_key" ON "MemeTag"("memeId", "hashtagId");

-- CreateIndex
CREATE INDEX "MemeVote_memeId_idx" ON "MemeVote"("memeId");

-- CreateIndex
CREATE UNIQUE INDEX "MemeVote_memeId_voterKey_key" ON "MemeVote"("memeId", "voterKey");
