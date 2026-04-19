/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Webhook` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Webhook_url_key" ON "Webhook"("url");
