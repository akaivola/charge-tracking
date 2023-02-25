/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_userId_key" ON "Provider"("name", "userId");
