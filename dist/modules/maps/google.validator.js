"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeDetailsSchema = exports.autocompleteSchema = exports.geolocationSchema = exports.snapRoadsSchema = exports.multiRouteSchema = exports.computeRouteSchema = void 0;
// validators/googleSchemas.ts
const zod_1 = require("zod");
// Schema for lat/lng point
const LatLngSchema = zod_1.z.object({
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
});
// /routes/compute
exports.computeRouteSchema = zod_1.z.object({
    origin: LatLngSchema,
    destination: LatLngSchema,
    waypoints: zod_1.z.array(LatLngSchema).optional(),
    travelMode: zod_1.z.enum(['DRIVE', 'WALK', 'BICYCLE', 'TRANSIT']).optional(),
});
// /routes/multi
exports.multiRouteSchema = exports.computeRouteSchema.extend({
    computeAlternativeRoutes: zod_1.z.boolean().optional(),
    routingPreference: zod_1.z
        .enum(['TRAFFIC_UNAWARE', 'TRAFFIC_AWARE', 'TRAFFIC_AWARE_OPTIMAL'])
        .optional(),
    departureTime: zod_1.z.string().optional(), // ISO timestamp if needed
});
// /roads/snap
exports.snapRoadsSchema = zod_1.z.object({
    points: zod_1.z.array(zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
    })),
});
// /geolocation
const WifiAccessPointSchema = zod_1.z.object({
    macAddress: zod_1.z.string(),
    signalStrength: zod_1.z.number(),
    age: zod_1.z.number().optional(),
    channel: zod_1.z.number().optional(),
});
// Cell Tower schema
const CellTowerSchema = zod_1.z.object({
    cellId: zod_1.z.number(),
    locationAreaCode: zod_1.z.number(),
    mobileCountryCode: zod_1.z.number(),
    mobileNetworkCode: zod_1.z.number(),
    signalStrength: zod_1.z.number(),
});
// Complete geolocation request schema
exports.geolocationSchema = zod_1.z.object({
    considerIp: zod_1.z.boolean().optional(),
    wifiAccessPoints: zod_1.z.array(WifiAccessPointSchema).optional(),
    cellTowers: zod_1.z.array(CellTowerSchema).optional(),
});
exports.autocompleteSchema = zod_1.z.object({
    input: zod_1.z.string().min(1, 'Input is required'),
    location: zod_1.z
        .object({
        lat: zod_1.z.number().min(-90).max(90),
        lng: zod_1.z.number().min(-180).max(180),
    })
        .optional(),
    radius: zod_1.z.number().min(1).max(50000).optional(),
});
/**
 * Place details validation
 * - placeId: required string
 */
exports.placeDetailsSchema = zod_1.z.object({
    placeId: zod_1.z.string().min(1, 'Place ID is required'),
});
