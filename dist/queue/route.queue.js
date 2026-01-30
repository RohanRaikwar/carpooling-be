"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeWorker = exports.routeQueue = void 0;
const bullmq_1 = require("bullmq");
const google_service_1 = require("../modules/maps/google.service");
const redisConnection_1 = require("./redisConnection");
exports.routeQueue = new bullmq_1.Queue('route-optimization', { connection: redisConnection_1.bullRedis });
exports.routeWorker = new bullmq_1.Worker('route-optimization', async (job) => {
    // job.data contains origin, destination, waypoints, travelMode
    const result = await google_service_1.googleService.computeRoute(job.data);
    return result;
}, { connection: redisConnection_1.bullRedis, concurrency: 5 });
// Optional: Log errors
exports.routeWorker.on('failed', (job, err) => {
    console.error('Job failed:', job.id, err);
});
