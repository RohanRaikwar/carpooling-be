"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleHttp = void 0;
const axios_client_1 = require("@lib/axios/axios.client");
exports.googleHttp = {
    /**
     * Google Places Autocomplete
     */
    autocomplete(payload) {
        const params = {
            input: payload.input,
            key: process.env.GOOGLE_MAPS_API_KEY,
        };
        if (payload.location) {
            params.location = `${payload.location.lat},${payload.location.lng}`;
            if (payload.radius)
                params.radius = payload.radius;
        }
        return axios_client_1.axiosClient.request({
            method: 'GET',
            baseURL: 'https://maps.googleapis.com',
            url: '/maps/api/place/autocomplete/json',
            params,
        });
    },
    /**
     * Get Google Place Details by placeId
     */
    placeDetails(placeId) {
        return axios_client_1.axiosClient.request({
            method: 'GET',
            baseURL: 'https://maps.googleapis.com',
            url: '/maps/api/place/details/json',
            params: {
                place_id: placeId,
                key: process.env.GOOGLE_MAPS_API_KEY,
                fields: 'name,formatted_address,geometry',
            },
        });
    },
    /**
     * Google Routes API
     */
    routes(payload) {
        return axios_client_1.axiosClient.request({
            method: 'POST',
            baseURL: 'https://routes.googleapis.com',
            url: '/directions/v2:computeRoutes',
            headers: {
                'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline',
            },
            data: payload,
        });
    },
    /**
     * Snap points to roads
     */
    roads(payload) {
        return axios_client_1.axiosClient.request({
            method: 'GET',
            baseURL: 'https://roads.googleapis.com',
            url: '/v1/snapToRoads',
            params: payload,
        });
    },
    /**
     * Geolocate user/device
     */
    geolocation(payload) {
        return axios_client_1.axiosClient.request({
            method: 'POST',
            baseURL: 'https://www.googleapis.com',
            url: '/geolocation/v1/geolocate',
            params: {
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
            data: payload,
        });
    },
};
