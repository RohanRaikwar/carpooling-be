"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleService = void 0;
// google.service.ts
const google_http_1 = require("./google.http");
const google_cluster_1 = require("./google.cluster");
const redis_1 = __importDefault(require("@cache/redis"));
const polyline_1 = __importDefault(require("@mapbox/polyline"));
const circuitBreaker_1 = require("@middlewares/circuitBreaker");
const routesBreaker = (0, circuitBreaker_1.createCircuitBreaker)(google_http_1.googleHttp.routes);
/**
 * Helper to detect if circuit breaker is open
 */
function isBreakerOpen(err) {
    return err?.message?.includes('Breaker is open');
}
exports.googleService = {
    async autocomplete(input, location, radius) {
        const cacheKey = `autocomplete:${input}:${location ? `${location.lat},${location.lng}` : 'none'}:${radius || 50000}`;
        // Try to get from cache
        const cached = await redis_1.default.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        // Fetch from Google API
        const response = await google_http_1.googleHttp.autocomplete({ input, location, radius });
        console.log(response);
        const predictions = response.predictions;
        // Cache results for 5 minutes
        await redis_1.default.set(cacheKey, JSON.stringify(predictions), 'EX', 300);
        return predictions;
    },
    /**
     * Google Place Details with Redis caching
     */
    async placeDetails(placeId) {
        const cacheKey = `placeDetails:${placeId}`;
        const cached = await redis_1.default.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const response = await google_http_1.googleHttp.placeDetails(placeId);
        console.log(response);
        const result = response.result;
        // Cache results for 10 minutes
        await redis_1.default.set(cacheKey, JSON.stringify(result), 'EX', 600);
        return result;
    },
    /**
     * Compute route with optional waypoints
     */
    async computeRoute(data) {
        const cacheKey = `route:${JSON.stringify(data)}`;
        const cached = await redis_1.default.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const clusters = (0, google_cluster_1.clusterStops)(data.waypoints || [], 25);
        const results = [];
        for (const group of clusters) {
            try {
                const result = await routesBreaker.fire({
                    origin: { location: { latLng: data.origin } },
                    destination: { location: { latLng: data.destination } },
                    intermediates: group.map((p) => ({ location: { latLng: p } })),
                    travelMode: data.travelMode || 'DRIVE',
                });
                if (result.routes && Array.isArray(result.routes)) {
                    result.routes = result.routes.map((route) => {
                        if (route.polyline?.encodedPolyline) {
                            route.decodedPath = polyline_1.default
                                .decode(route.polyline.encodedPolyline)
                                .map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
                        }
                        return route;
                    });
                }
                results.push(result);
            }
            catch (err) {
                if (isBreakerOpen(err)) {
                    console.warn('⚠️ Google Routes breaker is open, returning cached/partial data');
                    const fallback = await redis_1.default.get(cacheKey);
                    if (fallback)
                        return JSON.parse(fallback);
                    continue;
                }
                throw err;
            }
        }
        // Cache results for 5 minutes
        await redis_1.default.set(cacheKey, JSON.stringify(results), 'EX', 300);
        return results;
    },
    /**
     * Snap points to nearest roads
     */
    async snapToRoads(data) {
        return google_http_1.googleHttp.roads({
            path: data.points.map((p) => `${p.latitude},${p.longitude}`).join('|'),
            interpolate: true,
            key: process.env.GOOGLE_MAPS_API_KEY,
        });
    },
    /**
     * Get device/user geolocation
     */
    async geolocate(data) {
        return google_http_1.googleHttp.geolocation(data);
    },
    /**
     * Compute multiple alternative routes for same origin/destination
     */
    async computeMultiRoute(data) {
        const cacheKey = `multiRoute:${JSON.stringify(data)}`;
        const cached = await redis_1.default.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        try {
            const result = await routesBreaker.fire({
                origin: { location: { latLng: data.origin } },
                destination: { location: { latLng: data.destination } },
                travelMode: data.travelMode || 'DRIVE',
                routingPreference: data.routingPreference || 'TRAFFIC_UNAWARE',
                computeAlternativeRoutes: data.computeAlternativeRoutes ?? false,
                departureTime: data.departureTime,
            });
            const routesWithDecoded = (result.routes || []).map((route) => {
                const fullPath = [];
                const encoded = route.polyline?.encodedPolyline;
                if (encoded) {
                    const decoded = polyline_1.default
                        .decode(encoded)
                        .map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
                    fullPath.push(...decoded);
                }
                return {
                    ...route,
                    decodedPolyline: fullPath,
                };
            });
            await redis_1.default.set(cacheKey, JSON.stringify(routesWithDecoded), 'EX', 300);
            return routesWithDecoded;
        }
        catch (err) {
            if (isBreakerOpen(err)) {
                console.warn('⚠️ Google Routes breaker is open, returning cached multi-route if available');
                const fallback = await redis_1.default.get(cacheKey);
                if (fallback)
                    return JSON.parse(fallback);
            }
            throw err;
        }
    },
};
