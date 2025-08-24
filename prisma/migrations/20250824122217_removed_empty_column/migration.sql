/*
  Warnings:

  - You are about to drop the column `aiGeneratedAt` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `clinicalOpportunities` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `clinicalPearls` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `clinicalSummary` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `enhancedManagementPlan` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `investigations` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `keyFindings` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `savedAt` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `timeContext` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `clerkingStructure` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `clinicalReasoning` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `communicationNotes` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `improvementQuotes` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `positiveQuotes` on the `feedback` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."cases" DROP COLUMN "aiGeneratedAt",
DROP COLUMN "clinicalOpportunities",
DROP COLUMN "clinicalPearls",
DROP COLUMN "clinicalSummary",
DROP COLUMN "enhancedManagementPlan",
DROP COLUMN "investigations",
DROP COLUMN "keyFindings",
DROP COLUMN "savedAt",
DROP COLUMN "timeContext";

-- AlterTable
ALTER TABLE "public"."feedback" DROP COLUMN "clerkingStructure",
DROP COLUMN "clinicalReasoning",
DROP COLUMN "communicationNotes",
DROP COLUMN "improvementQuotes",
DROP COLUMN "positiveQuotes";
