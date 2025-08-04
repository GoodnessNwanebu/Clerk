-- AlterTable
ALTER TABLE "public"."cases" ADD COLUMN     "aiGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "clinicalPearls" TEXT,
ADD COLUMN     "clinicalSummary" TEXT,
ADD COLUMN     "investigations" JSONB,
ADD COLUMN     "keyFindings" JSONB;
