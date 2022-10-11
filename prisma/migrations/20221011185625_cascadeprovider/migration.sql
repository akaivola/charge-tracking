-- DropForeignKey
ALTER TABLE "ChargeEvent" DROP CONSTRAINT "ChargeEvent_provider_fkey";

-- AddForeignKey
ALTER TABLE "ChargeEvent" ADD CONSTRAINT "ChargeEvent_provider_fkey" FOREIGN KEY ("provider") REFERENCES "Provider"("name") ON DELETE NO ACTION ON UPDATE CASCADE;
