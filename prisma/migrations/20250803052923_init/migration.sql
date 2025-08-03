-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('Patient', 'Practitioner');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('Pending', 'Active', 'Inactive', 'Suspended');

-- CreateEnum
CREATE TYPE "public"."AppointmentType" AS ENUM ('Physical', 'Remote');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'NoShow');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('AppointmentCompleted', 'XRayUpload', 'AIClassification', 'CobbAngleMeasurement', 'SessionNote');

-- CreateEnum
CREATE TYPE "public"."AIClassificationType" AS ENUM ('NoScoliosisDetected', 'ScoliosisCCurve', 'ScoliosisSCurve', 'NotASpinalXray', 'NoXrayDetected', 'AnalysisFailed');

-- CreateTable
CREATE TABLE "public"."AppUser" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Practitioner" (
    "appUserId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "medicalLicense" TEXT NOT NULL,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'Pending',
    "clinicId" TEXT,

    CONSTRAINT "Practitioner_pkey" PRIMARY KEY ("appUserId")
);

-- CreateTable
CREATE TABLE "public"."Patient" (
    "appUserId" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "dateOfBirth" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "clinicId" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("appUserId")
);

-- CreateTable
CREATE TABLE "public"."Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "appointmentDateTime" TIMESTAMP(3) NOT NULL,
    "durationInMinutes" INTEGER NOT NULL,
    "type" "public"."AppointmentType" NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientEvent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdByPractitionerId" TEXT NOT NULL,
    "eventType" "public"."EventType" NOT NULL,
    "eventDateTime" TIMESTAMP(3) NOT NULL,
    "isSharedWithPatient" BOOLEAN NOT NULL,
    "appointmentId" TEXT,

    CONSTRAINT "PatientEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedEventId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."XRayImage" (
    "id" TEXT NOT NULL,
    "patientEventId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "XRayImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIClassificationResult" (
    "id" TEXT NOT NULL,
    "patientEventId" TEXT NOT NULL,
    "classificationResult" "public"."AIClassificationType" NOT NULL,
    "confidenceScore" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AIClassificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoliosisMeasurement" (
    "id" TEXT NOT NULL,
    "patientEventId" TEXT NOT NULL,
    "cobbAngle" DECIMAL(65,30) NOT NULL,
    "rotationAngle" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ScoliosisMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionNote" (
    "id" TEXT NOT NULL,
    "patientEventId" TEXT NOT NULL,
    "noteContent" TEXT NOT NULL,

    CONSTRAINT "SessionNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "public"."AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PatientEvent_appointmentId_key" ON "public"."PatientEvent"("appointmentId");

-- AddForeignKey
ALTER TABLE "public"."Practitioner" ADD CONSTRAINT "Practitioner_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Practitioner" ADD CONSTRAINT "Practitioner_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "public"."Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "public"."Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientEvent" ADD CONSTRAINT "PatientEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientEvent" ADD CONSTRAINT "PatientEvent_createdByPractitionerId_fkey" FOREIGN KEY ("createdByPractitionerId") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientEvent" ADD CONSTRAINT "PatientEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_relatedEventId_fkey" FOREIGN KEY ("relatedEventId") REFERENCES "public"."PatientEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XRayImage" ADD CONSTRAINT "XRayImage_patientEventId_fkey" FOREIGN KEY ("patientEventId") REFERENCES "public"."PatientEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIClassificationResult" ADD CONSTRAINT "AIClassificationResult_patientEventId_fkey" FOREIGN KEY ("patientEventId") REFERENCES "public"."PatientEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoliosisMeasurement" ADD CONSTRAINT "ScoliosisMeasurement_patientEventId_fkey" FOREIGN KEY ("patientEventId") REFERENCES "public"."PatientEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionNote" ADD CONSTRAINT "SessionNote_patientEventId_fkey" FOREIGN KEY ("patientEventId") REFERENCES "public"."PatientEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
