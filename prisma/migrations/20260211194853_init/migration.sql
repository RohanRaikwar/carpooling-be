-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('VEHICLE_IMAGE', 'VEHICLE_DOCUMENT', 'DRIVING_LICENSE', 'INSURANCE_DOCUMENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "documentType" "DocumentType",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "model_name" TEXT;
