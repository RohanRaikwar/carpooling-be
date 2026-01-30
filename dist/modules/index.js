"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = exports.mapRouter = exports.travelPreferenceRouter = exports.vehiclesRouter = exports.authRouter = void 0;
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
exports.authRouter = auth_routes_1.default;
const vehicle_routes_1 = __importDefault(require("./vehicles/vehicle.routes"));
exports.vehiclesRouter = vehicle_routes_1.default;
const travelPreference_routes_1 = __importDefault(require("./travel-preferences/travelPreference.routes"));
exports.travelPreferenceRouter = travelPreference_routes_1.default;
const google_routes_1 = __importDefault(require("./maps/google.routes"));
exports.mapRouter = google_routes_1.default;
const user_routes_1 = __importDefault(require("./user/user.routes"));
exports.userRouter = user_routes_1.default;
