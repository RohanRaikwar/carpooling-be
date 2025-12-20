"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// router.route('/').post(protect, authorize('driver', 'admin'), createRide).get(getRides);
// router.route('/:id/join').post(protect, joinRide);
exports.default = router;
