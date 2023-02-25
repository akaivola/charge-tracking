/*
  Warnings:

  - You are about to drop the column `provider` on the `ChargeEvent` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Provider` table. All the data in the column will be lost.
  - Added the required column `providerId` to the `ChargeEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChargeEvent" DROP CONSTRAINT "ChargeEvent_provider_fkey";

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_userId_fkey";

-- DropIndex
DROP INDEX "Provider_name_key";

-- DropIndex
DROP INDEX "Provider_userId_key";

-- AlterTable
ALTER TABLE "ChargeEvent" DROP COLUMN "provider",
ADD COLUMN     "providerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "userId",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Provider_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "ProvidersOnUsers" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "providerId" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvidersOnUsers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProvidersOnUsers" ADD CONSTRAINT "ProvidersOnUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvidersOnUsers" ADD CONSTRAINT "ProvidersOnUsers_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeEvent" ADD CONSTRAINT "ChargeEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
