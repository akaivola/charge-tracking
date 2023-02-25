/*
  Warnings:

  - You are about to drop the `ProvidersOnUsers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProvidersOnUsers" DROP CONSTRAINT "ProvidersOnUsers_providerId_fkey";

-- DropForeignKey
ALTER TABLE "ProvidersOnUsers" DROP CONSTRAINT "ProvidersOnUsers_userId_fkey";

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "userId" BIGINT NOT NULL;

-- DropTable
DROP TABLE "ProvidersOnUsers";

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
