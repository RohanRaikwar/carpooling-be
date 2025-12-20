"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/carpooling';
        await mongoose_1.default.connect(mongoURI);
        console.log(`Connecting to MongoDB at ${mongoURI}`);
        logger_1.default.info('MongoDB Connected...');
    }
    catch (err) {
        logger_1.default.error('MongoDB connection error:', err);
        process.exit(1);
    }
};
exports.default = connectDB;
