-- CreateEnum
CREATE TYPE "public"."VideoCallStatus" AS ENUM ('Waiting', 'InProgress', 'Ended');

-- CreateTable
CREATE TABLE "public"."VideoCallRoom" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" "public"."VideoCallStatus" NOT NULL DEFAULT 'Waiting',
    "practitionerJoined" BOOLEAN NOT NULL DEFAULT false,
    "patientJoined" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCallRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoCallRoom_appointmentId_key" ON "public"."VideoCallRoom"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCallRoom_roomId_key" ON "public"."VideoCallRoom"("roomId");

-- AddForeignKey
ALTER TABLE "public"."VideoCallRoom" ADD CONSTRAINT "VideoCallRoom_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
