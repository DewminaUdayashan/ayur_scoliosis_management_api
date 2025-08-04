/*
  Warnings:

  - A unique constraint covering the columns `[patientEventId]` on the table `AIClassificationResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[relatedEventId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appUserId]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appUserId]` on the table `Practitioner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[patientEventId]` on the table `ScoliosisMeasurement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[patientEventId]` on the table `SessionNote` will be added. If there are existing duplicate values, this will fail.
  - Made the column `clinicId` on table `Patient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clinicId` on table `Practitioner` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Patient" DROP CONSTRAINT "Patient_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Practitioner" DROP CONSTRAINT "Practitioner_clinicId_fkey";

-- AlterTable
ALTER TABLE "public"."Patient" ALTER COLUMN "dateOfBirth" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "clinicId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Practitioner" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "clinicId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AIClassificationResult_patientEventId_key" ON "public"."AIClassificationResult"("patientEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_relatedEventId_key" ON "public"."Notification"("relatedEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_appUserId_key" ON "public"."Patient"("appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_appUserId_key" ON "public"."Practitioner"("appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoliosisMeasurement_patientEventId_key" ON "public"."ScoliosisMeasurement"("patientEventId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionNote_patientEventId_key" ON "public"."SessionNote"("patientEventId");

-- AddForeignKey
ALTER TABLE "public"."Practitioner" ADD CONSTRAINT "Practitioner_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "public"."Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "public"."Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
