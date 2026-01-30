"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const _modules_1 = require("@modules");
const rideRoutes_1 = __importDefault(require("./routes/rideRoutes"));
const database_1 = __importDefault(require("@config/database"));
const _middlewares_1 = require("@middlewares");
const app = (0, express_1.default)();
(0, database_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use('/api/v1/auth', _modules_1.authRouter);
app.use('/api/v1/users', _middlewares_1.protect, _modules_1.userRouter);
app.use('/api/v1/rides', rideRoutes_1.default);
app.use('/api/v1/vehicles', _middlewares_1.protect, _modules_1.vehiclesRouter);
app.use('/api/v1/travel-preferences', _middlewares_1.protect, _modules_1.travelPreferenceRouter);
app.use('/api/v1/maps', _middlewares_1.protect, _modules_1.mapRouter);
app.use(_middlewares_1.errorHandler);
exports.default = app;
