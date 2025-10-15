-- CreateTable
CREATE TABLE "public"."XRayMeasurement" (
    "id" TEXT NOT NULL,
    "xrayImageId" TEXT NOT NULL,
    "line1StartX" DECIMAL(65,30) NOT NULL,
    "line1StartY" DECIMAL(65,30) NOT NULL,
    "line1EndX" DECIMAL(65,30) NOT NULL,
    "line1EndY" DECIMAL(65,30) NOT NULL,
    "line2StartX" DECIMAL(65,30) NOT NULL,
    "line2StartY" DECIMAL(65,30) NOT NULL,
    "line2EndX" DECIMAL(65,30) NOT NULL,
    "line2EndY" DECIMAL(65,30) NOT NULL,
    "cobbAngle" DECIMAL(65,30) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "XRayMeasurement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."XRayMeasurement" ADD CONSTRAINT "XRayMeasurement_xrayImageId_fkey" FOREIGN KEY ("xrayImageId") REFERENCES "public"."XRayImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XRayMeasurement" ADD CONSTRAINT "XRayMeasurement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
