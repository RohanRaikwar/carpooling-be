"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpStatus = void 0;
var HttpStatus;
(function (HttpStatus) {
    HttpStatus["OK"] = "OK";
    HttpStatus["CREATED"] = "CREATED";
    HttpStatus["BAD_REQUEST"] = "BAD_REQUEST";
    HttpStatus["UNAUTHORIZED"] = "UNAUTHORIZED";
    HttpStatus["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    HttpStatus["FORBIDDEN"] = "FORBIDDEN";
    HttpStatus["NOT_FOUND"] = "NOT_FOUND";
    HttpStatus["CONFLICT"] = "CONFLICT";
    HttpStatus["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(HttpStatus || (exports.HttpStatus = HttpStatus = {}));
