/*
  Warnings:

  - You are about to drop the `email_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."email_reports" DROP CONSTRAINT "email_reports_caseId_fkey";

-- DropTable
DROP TABLE "public"."email_reports";
