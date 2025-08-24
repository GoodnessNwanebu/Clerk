-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
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
CREATE TABLE "public"."case_sessions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_sessions_pkey" PRIMARY KEY ("id")
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
    "clinicalSummary" TEXT,
    "keyFindings" JSONB,
    "investigations" JSONB,
    "enhancedManagementPlan" JSONB,
    "clinicalOpportunities" JSONB,
    "clinicalPearls" TEXT,
    "aiGeneratedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "savedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
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
    "keyLearningPoint" TEXT NOT NULL,
    "whatYouDidWell" TEXT[],
    "whatCouldBeImproved" TEXT[],
    "clinicalTip" TEXT NOT NULL,
    "positiveQuotes" JSONB,
    "improvementQuotes" JSONB,
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
CREATE TABLE "public"."case_reports" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "clinicalSummary" TEXT NOT NULL,
    "historyOfPresentingComplaint" TEXT,
    "pastMedicalHistory" TEXT,
    "examinationFindings" TEXT,
    "investigationResults" TEXT,
    "diagnosis" TEXT,
    "managementPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "case_sessions_sessionId_key" ON "public"."case_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "public"."departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subspecialties_name_departmentId_key" ON "public"."subspecialties"("name", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "cases_sessionId_key" ON "public"."cases"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_caseId_key" ON "public"."feedback"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "case_reports_caseId_key" ON "public"."case_reports"("caseId");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_sessions" ADD CONSTRAINT "case_sessions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_sessions" ADD CONSTRAINT "case_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "public"."case_reports" ADD CONSTRAINT "case_reports_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
