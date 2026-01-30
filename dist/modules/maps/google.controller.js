"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleController = void 0;
const google_service_1 = require("./google.service");
const _utils_1 = require("@utils");
exports.googleController = {
    /* ================= ROUTES ================= */
    async autocomplete(req, res) {
        try {
            const { input, lat, lng, radius } = req.query;
            const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
            const predictions = await google_service_1.googleService.autocomplete(input, location, radius ? parseInt(radius) : undefined);
            // Return only name, description, and placeId
            const formatted = predictions.map((p) => ({
                description: p.description,
                placeId: p.place_id,
            }));
            return (0, _utils_1.sendSuccess)(res, {
                status: _utils_1.HttpStatus.OK,
                message: 'Autocomplete fetched successfully',
                data: formatted,
            });
        }
        catch (err) {
            return (0, _utils_1.sendError)(res, {
                status: err.status || _utils_1.HttpStatus.INTERNAL_ERROR,
                message: err.message || 'Autocomplete failed',
                error: err,
            });
        }
    },
    // Fetch full place details
    async placeDetails(req, res) {
        try {
            const { placeId } = req.query;
            const details = await google_service_1.googleService.placeDetails(placeId);
            return (0, _utils_1.sendSuccess)(res, {
                status: _utils_1.HttpStatus.OK,
                message: 'Place details fetched successfully',
                data: {
                    name: details.name,
                    address: details.formatted_address,
                    location: details.geometry.location,
                },
            });
        }
        catch (err) {
            return (0, _utils_1.sendError)(res, {
                status: err.status || _utils_1.HttpStatus.INTERNAL_ERROR,
                message: err.message || 'Place details failed',
                error: err,
            });
        }
    },
    async routes(req, res) {
        try {
            const data = await google_service_1.googleService.computeRoute(req.body);
            return (0, _utils_1.sendSuccess)(res, {
                status: _utils_1.HttpStatus.OK,
                message: 'Route computed successfully',
                data,
            });
        }
        catch (err) {
            return (0, _utils_1.sendError)(res, {
                status: err.status || _utils_1.HttpStatus.INTERNAL_ERROR,
                message: err.message || 'Failed to compute route',
                error: err,
            });
        }
    },
    /* ================= MULTI ROUTES ================= */
    async multiRoute(req, res) {
        try {
            const data = await google_service_1.googleService.computeMultiRoute(req.body);
            return (0, _utils_1.sendSuccess)(res, {
                status: _utils_1.HttpStatus.OK,
                message: 'Multiple routes fetched successfully',
                data,
            });
        }
        catch (err) {
            return (0, _utils_1.sendError)(res, {
                status: err.status || _utils_1.HttpStatus.INTERNAL_ERROR,
                message: err.message || 'Failed to fetch routes',
                error: err,
            });
        }
    },
    /* ================= ROADS ================= */
    async roads(req, res) {
        try {
            const data = await google_service_1.googleService.snapToRoads(req.body);
            return (0, _utils_1.sendSuccess)(res, {
                status: _utils_1.HttpStatus.OK,
                message: 'Points snapped to roads successfully',
                data,
            });
        }
        catch (err) {
            return (0, _utils_1.sendError)(res, {
                status: err.status || _utils_1.HttpStatus.INTERNAL_ERROR,
                message: err.message || 'Snap to roads failed',
                error: err,
            });
        }
    },
    /* ================= GEOLOCATION ================= */
    async geolocation(req, res) {
        try {
            const data = await google_service_1.googleService.geolocate(req.body);
            return (0, _utils_1.sendSuccess)(res, {
                status: _utils_1.HttpStatus.OK,
                message: 'Geolocation successful',
                data,
            });
        }
        catch (err) {
            return (0, _utils_1.sendError)(res, {
                status: err.status || _utils_1.HttpStatus.INTERNAL_ERROR,
                message: err.message || 'Geolocation failed',
                error: err,
            });
        }
    },
};
