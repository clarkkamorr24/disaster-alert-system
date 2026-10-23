-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "HazardType" ADD VALUE 'STRONG_WIND';
ALTER TYPE "HazardType" ADD VALUE 'DROUGHT';

-- AlterTable
ALTER TABLE "hazard_alert" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "hazard_alert_idempotencyKey_key" ON "hazard_alert"("idempotencyKey");
