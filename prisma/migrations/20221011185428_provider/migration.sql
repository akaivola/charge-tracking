-- CreateTable
CREATE TABLE "Provider" (
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- AddForeignKey
ALTER TABLE "ChargeEvent" ADD CONSTRAINT "ChargeEvent_provider_fkey" FOREIGN KEY ("provider") REFERENCES "Provider"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
