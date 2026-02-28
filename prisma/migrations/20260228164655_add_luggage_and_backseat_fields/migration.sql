-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "backSeatOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxLuggagePerPerson" INTEGER NOT NULL DEFAULT 2;
