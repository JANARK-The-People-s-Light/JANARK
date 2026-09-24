-- CreateTable
CREATE TABLE "InteractionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "surface" TEXT NOT NULL DEFAULT 'web',
    "visitorId" TEXT,
    "sessionId" TEXT,
    "anonId" TEXT,
    "path" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "propsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "InteractionEvent_name_createdAt_idx" ON "InteractionEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_visitorId_createdAt_idx" ON "InteractionEvent"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_anonId_createdAt_idx" ON "InteractionEvent"("anonId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_targetType_targetId_createdAt_idx" ON "InteractionEvent"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionEvent_createdAt_idx" ON "InteractionEvent"("createdAt");
