-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subspecialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subspecialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_profiles" (
    "id" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "healthLiteracy" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "recordKeeping" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pediatric_profiles" (
    "id" TEXT NOT NULL,
    "patientAge" INTEGER NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "respondingParent" TEXT NOT NULL,
    "developmentalStage" TEXT NOT NULL,
    "communicationLevel" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pediatric_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cases" (
    "id" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "primaryInfo" TEXT NOT NULL,
    "openingLine" TEXT NOT NULL,
    "isPediatric" BOOLEAN NOT NULL DEFAULT false,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'standard',
    "timeContext" TEXT,
    "location" TEXT,
    "isSurgical" BOOLEAN NOT NULL DEFAULT false,
    "pathophysiologyCategory" TEXT,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "patientProfileId" TEXT,
    "pediatricProfileId" TEXT,
    "preliminaryDiagnosis" TEXT,
    "examinationPlan" TEXT,
    "investigationPlan" TEXT,
    "finalDiagnosis" TEXT,
    "managementPlan" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "speakerLabel" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."examination_results" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "rangeLow" DOUBLE PRECISION,
    "rangeHigh" DOUBLE PRECISION,
    "status" TEXT,
    "findings" TEXT,
    "impression" TEXT,
    "recommendation" TEXT,
    "abnormalFlags" TEXT[],
    "reportType" TEXT,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "examination_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."investigation_results" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "rangeLow" DOUBLE PRECISION,
    "rangeHigh" DOUBLE PRECISION,
    "status" TEXT,
    "findings" TEXT,
    "impression" TEXT,
    "recommendation" TEXT,
    "abnormalFlags" TEXT[],
    "reportType" TEXT,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "investigation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "keyTakeaway" TEXT NOT NULL,
    "whatYouDidWell" TEXT[],
    "whatCouldBeImproved" TEXT[],
    "clinicalTip" TEXT NOT NULL,
    "positiveQuotes" JSONB,
    "improvementQuotes" JSONB,
    "keyLearningPoint" TEXT,
    "clerkingStructure" TEXT,
    "missedOpportunities" JSONB,
    "clinicalReasoning" TEXT,
    "communicationNotes" TEXT,
    "clinicalPearls" TEXT[],
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_reports" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',

    CONSTRAINT "email_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "public"."departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subspecialties_name_departmentId_key" ON "public"."subspecialties"("name", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_caseId_key" ON "public"."feedback"("caseId");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subspecialties" ADD CONSTRAINT "subspecialties_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pediatric_profiles" ADD CONSTRAINT "pediatric_profiles_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_pediatricProfileId_fkey" FOREIGN KEY ("pediatricProfileId") REFERENCES "public"."pediatric_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."examination_results" ADD CONSTRAINT "examination_results_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."investigation_results" ADD CONSTRAINT "investigation_results_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_reports" ADD CONSTRAINT "email_reports_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
