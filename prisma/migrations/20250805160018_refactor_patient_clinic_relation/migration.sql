/*
  Warnings:

  - You are about to drop the column `clinicId` on the `Patient` table. All the data in the column will be lost.
  - Added the required column `practitionerId` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Patient" DROP CONSTRAINT "Patient_clinicId_fkey";

-- AlterTable
ALTER TABLE "public"."AppUser" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Patient" DROP COLUMN "clinicId",
ADD COLUMN     "practitionerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "public"."Practitioner"("appUserId") ON DELETE RESTRICT ON UPDATE CASCADE;
