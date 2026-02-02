/*
  Warnings:

  - You are about to drop the column `vehicleModel` on the `Vehicle` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VehicleType" ADD VALUE 'suv';
ALTER TYPE "VehicleType" ADD VALUE 'coupe';
ALTER TYPE "VehicleType" ADD VALUE 'convertible';
ALTER TYPE "VehicleType" ADD VALUE 'pickup';
ALTER TYPE "VehicleType" ADD VALUE 'van';
ALTER TYPE "VehicleType" ADD VALUE 'truck';

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "vehicleModel",
ADD COLUMN     "model_num" TEXT;
