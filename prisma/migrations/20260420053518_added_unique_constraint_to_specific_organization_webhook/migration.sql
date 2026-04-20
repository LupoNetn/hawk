/*
  Warnings:

  - A unique constraint covering the columns `[orgId,url]` on the table `Webhook` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Webhook_url_key";

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_orgId_url_key" ON "Webhook"("orgId", "url");
