"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = void 0;
const connect_timeout_1 = __importDefault(require("connect-timeout"));
exports.requestTimeout = (0, connect_timeout_1.default)('15s');
