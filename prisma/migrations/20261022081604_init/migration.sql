-- CreateEnum
CREATE TYPE "HazardType" AS ENUM ('VOLCANIC_ERUPTION', 'ASHFALL', 'LAHAR', 'TYPHOON', 'HEAVY_RAIN', 'FLOOD');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RecipientStatus" AS ENUM ('PENDING', 'RETRYING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "officer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "crops" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hazard_alert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hazardType" "HazardType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "officialLevel" TEXT,
    "description" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hazard_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "creditsPerRecipient" INTEGER NOT NULL,
    "blastIds" TEXT[],
    "alertId" TEXT,
    "retryOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_recipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "memberId" TEXT,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecipientStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "failReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcast_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hazardType" "HazardType",
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FarmZoneToHazardAlert" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FarmZoneToHazardAlert_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "officer_email_key" ON "officer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "farm_zone_name_key" ON "farm_zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "member_phone_key" ON "member"("phone");

-- CreateIndex
CREATE INDEX "member_zoneId_isActive_idx" ON "member"("zoneId", "isActive");

-- CreateIndex
CREATE INDEX "hazard_alert_status_createdAt_idx" ON "hazard_alert"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_idempotencyKey_key" ON "broadcast"("idempotencyKey");

-- CreateIndex
CREATE INDEX "broadcast_createdAt_idx" ON "broadcast"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_recipient_providerRef_key" ON "broadcast_recipient"("providerRef");

-- CreateIndex
CREATE INDEX "broadcast_recipient_broadcastId_status_idx" ON "broadcast_recipient"("broadcastId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_recipient_broadcastId_phone_key" ON "broadcast_recipient"("broadcastId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "message_template_name_key" ON "message_template"("name");

-- CreateIndex
CREATE INDEX "_FarmZoneToHazardAlert_B_index" ON "_FarmZoneToHazardAlert"("B");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "farm_zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "hazard_alert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_retryOfId_fkey" FOREIGN KEY ("retryOfId") REFERENCES "broadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_recipient" ADD CONSTRAINT "broadcast_recipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_recipient" ADD CONSTRAINT "broadcast_recipient_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FarmZoneToHazardAlert" ADD CONSTRAINT "_FarmZoneToHazardAlert_A_fkey" FOREIGN KEY ("A") REFERENCES "farm_zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FarmZoneToHazardAlert" ADD CONSTRAINT "_FarmZoneToHazardAlert_B_fkey" FOREIGN KEY ("B") REFERENCES "hazard_alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
