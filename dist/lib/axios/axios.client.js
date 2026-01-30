"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosClient = void 0;
const axios_1 = __importDefault(require("axios"));
class AxiosClient {
    constructor(baseURL) {
        this.client = axios_1.default.create({
            baseURL,
            timeout: 15000,
        });
    }
    /**
     * Makes an axios request and returns raw data.
     * Throws an error if request fails.
     */
    async request(config) {
        try {
            const res = await this.client.request(config);
            return res.data; // only raw data
        }
        catch (err) {
            // flatten error to a simple Error object
            let message = 'Unknown error occurred';
            if (axios_1.default.isAxiosError(err)) {
                message =
                    err.response?.data?.error?.message ||
                        err.response?.data?.message ||
                        err.message ||
                        message;
            }
            else if (err instanceof Error) {
                message = err.message;
            }
            throw new Error(message); // just throw error
        }
    }
}
exports.axiosClient = new AxiosClient();
