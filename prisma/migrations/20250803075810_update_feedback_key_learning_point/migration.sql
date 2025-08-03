/*
  Warnings:

  - You are about to drop the column `keyTakeaway` on the `feedback` table. All the data in the column will be lost.
  - Made the column `keyLearningPoint` on table `feedback` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."feedback" DROP COLUMN "keyTakeaway",
ALTER COLUMN "keyLearningPoint" SET NOT NULL;
