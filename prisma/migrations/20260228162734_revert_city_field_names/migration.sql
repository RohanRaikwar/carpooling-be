-- RenameColumns (safe, preserves data)
ALTER TABLE "Ride" RENAME COLUMN "originCityPlaceId" TO "originPlaceId";
ALTER TABLE "Ride" RENAME COLUMN "originCityName" TO "originAddress";
ALTER TABLE "Ride" RENAME COLUMN "destinationCityPlaceId" TO "destinationPlaceId";
ALTER TABLE "Ride" RENAME COLUMN "destinationCityName" TO "destinationAddress";
