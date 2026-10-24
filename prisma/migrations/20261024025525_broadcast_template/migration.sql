-- AlterTable
ALTER TABLE "broadcast" ADD COLUMN     "templateId" TEXT;

-- CreateIndex
CREATE INDEX "broadcast_templateId_idx" ON "broadcast"("templateId");

-- AddForeignKey
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
