-- AlterTable
ALTER TABLE "MedicalReport" ADD COLUMN     "formData" JSONB,
ADD COLUMN     "imaging" JSONB,
ADD COLUMN     "isReferred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labResults" JSONB,
ADD COLUMN     "medicalReportGroupId" TEXT,
ADD COLUMN     "referralNotes" TEXT,
ADD COLUMN     "referralReason" TEXT,
ADD COLUMN     "referredTo" TEXT,
ADD COLUMN     "vitalSigns" JSONB;

-- CreateTable
CREATE TABLE "MedicalReportGroup" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalReportGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicalReportGroup" ADD CONSTRAINT "MedicalReportGroup_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalReport" ADD CONSTRAINT "MedicalReport_medicalReportGroupId_fkey" FOREIGN KEY ("medicalReportGroupId") REFERENCES "MedicalReportGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
