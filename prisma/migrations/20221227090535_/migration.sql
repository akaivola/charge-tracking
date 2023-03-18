-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "userId" BIGINT NULL;

UPDATE "Provider" set "userId" = (select id from "User" limit 1);

ALTER TABLE "Provider" ALTER COLUMN "userId" SET NOT NULL;
-- CreateIndex
CREATE UNIQUE INDEX "Provider_userId_key" ON "Provider"("userId");

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
