-- AlterTable
ALTER TABLE "public"."cases" ADD COLUMN     "clinicalOpportunities" JSONB,
ADD COLUMN     "enhancedManagementPlan" JSONB;
