-- AlterTable
ALTER TABLE "public"."cases" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savedAt" TIMESTAMP(3);
