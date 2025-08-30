-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "pwaInstallSource" TEXT,
ADD COLUMN     "pwaInstalledAt" TIMESTAMP(3);
