/*
  Warnings:

  - You are about to drop the column `clinicalSummary` on the `case_reports` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis` on the `case_reports` table. All the data in the column will be lost.
  - You are about to drop the column `examinationFindings` on the `case_reports` table. All the data in the column will be lost.
  - You are about to drop the column `historyOfPresentingComplaint` on the `case_reports` table. All the data in the column will be lost.
  - You are about to drop the column `investigationResults` on the `case_reports` table. All the data in the column will be lost.
  - You are about to drop the column `managementPlan` on the `case_reports` table. All the data in the column will be lost.
  - You are about to drop the column `pastMedicalHistory` on the `case_reports` table. All the data in the column will be lost.
  - Added the required column `assessment` to the `case_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examination` to the `case_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `investigations` to the `case_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `management` to the `case_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientInfo` to the `case_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."case_reports" DROP COLUMN "clinicalSummary",
DROP COLUMN "diagnosis",
DROP COLUMN "examinationFindings",
DROP COLUMN "historyOfPresentingComplaint",
DROP COLUMN "investigationResults",
DROP COLUMN "managementPlan",
DROP COLUMN "pastMedicalHistory",
ADD COLUMN     "assessment" JSONB NOT NULL,
ADD COLUMN     "examination" JSONB NOT NULL,
ADD COLUMN     "investigations" JSONB NOT NULL,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "learningPoints" TEXT[],
ADD COLUMN     "management" JSONB NOT NULL,
ADD COLUMN     "patientInfo" JSONB NOT NULL;
