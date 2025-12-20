"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mailer_1 = require("./config/mailer");
const http_1 = __importDefault(require("http")); // Added: Import http module
const app_1 = __importDefault(require("./app"));
// import connectDB from './config/database';
// import { connectRedis } from './config/redis';
const logger_1 = __importDefault(require("./utils/logger"));
// import { initSocket } from './socket';
const PORT = process.env.PORT || 3000;
(async () => {
    await (0, mailer_1.verifyMailer)();
})();
const startServer = async () => {
    try {
        // await connectDB();
        // await connectRedis();
        const server = http_1.default.createServer(app_1.default); // Changed: Create http server
        // await initSocket(server); // Added: Initialize Socket.IO
        server.listen(PORT, () => {
            // Changed: Listen on the http server
            logger_1.default.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
