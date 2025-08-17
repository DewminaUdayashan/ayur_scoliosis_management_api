/*
  Warnings:

  - You are about to drop the column `phone` on the `Practitioner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."AppUser" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "public"."Practitioner" DROP COLUMN "phone";
