-- CreateTable
CREATE TABLE "ScoutReport" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tweetCount" INTEGER,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoutReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "reportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "prdContent" TEXT,
    "deployUrl" TEXT,
    "queuedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ScoutReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
