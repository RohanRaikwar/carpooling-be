-- Rename origin/destination columns to city naming convention
ALTER TABLE "Ride" RENAME COLUMN "originPlaceId" TO "originCityPlaceId";
ALTER TABLE "Ride" RENAME COLUMN "originAddress" TO "originCityName";
ALTER TABLE "Ride" RENAME COLUMN "destinationPlaceId" TO "destinationCityPlaceId";
ALTER TABLE "Ride" RENAME COLUMN "destinationAddress" TO "destinationCityName";
