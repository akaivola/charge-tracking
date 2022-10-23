/*
  Warnings:

  - You are about to alter the column `kiloWattHours` on the `ChargeEvent` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,2)`.
  - You are about to alter the column `pricePerKiloWattHour` on the `ChargeEvent` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,2)`.

*/
-- AlterTable
ALTER TABLE "ChargeEvent" ALTER COLUMN "kiloWattHours" SET DATA TYPE DECIMAL(6,2),
ALTER COLUMN "pricePerKiloWattHour" SET DATA TYPE DECIMAL(6,2);
