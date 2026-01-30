"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clusterStops = void 0;
const clusterStops = (stops, size = 25) => {
    const clusters = [];
    for (let i = 0; i < stops.length; i += size) {
        clusters.push(stops.slice(i, i + size));
    }
    return clusters;
};
exports.clusterStops = clusterStops;
