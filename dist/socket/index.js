"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const redis_1 = require("redis");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const logger_1 = __importDefault(require("../utils/logger"));
const initSocket = async (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    const pubClient = (0, redis_1.createClient)({ url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}` });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    io.on('connection', (socket) => {
        logger_1.default.info(`New client connected: ${socket.id}`);
        socket.on('join_ride', (rideId) => {
            socket.join(`ride_${rideId}`);
            logger_1.default.info(`Socket ${socket.id} joined ride_${rideId}`);
        });
        socket.on('disconnect', () => {
            logger_1.default.info(`Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
