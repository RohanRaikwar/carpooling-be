"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRide = exports.getRides = exports.createRide = void 0;
const Ride_1 = __importDefault(require("../models/Ride"));
const createRide = async (req, res) => {
    try {
        const { origin, destination, departureTime, seats, price, preferences } = req.body;
        const ride = await Ride_1.default.create({
            driver: req.user.id,
            origin,
            destination,
            departureTime,
            seats,
            availableSeats: seats,
            price,
            preferences,
        });
        res.status(201).json(ride);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createRide = createRide;
const getRides = async (req, res) => {
    try {
        const { originLat, originLng, destLat, destLng, date } = req.query;
        const query = { status: 'published', availableSeats: { $gt: 0 } };
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            query.departureTime = { $gte: startDate, $lt: endDate };
        }
        // Basic geospatial query if coordinates provided
        if (originLat && originLng) {
            query.origin = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(originLng), parseFloat(originLat)],
                    },
                    $maxDistance: 5000, // 5km radius
                },
            };
        }
        const rides = await Ride_1.default.find(query).populate('driver', 'name avatar rating');
        res.json(rides);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRides = getRides;
const joinRide = async (req, res) => {
    try {
        const rideId = req.params.id;
        const userId = req.user.id;
        // Optimistic concurrency control
        const ride = await Ride_1.default.findOneAndUpdate({ _id: rideId, availableSeats: { $gt: 0 } }, {
            $inc: { availableSeats: -1 },
            $push: { passengers: userId }
        }, { new: true });
        if (!ride) {
            return res.status(400).json({ message: 'Ride full or not found' });
        }
        res.json(ride);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.joinRide = joinRide;
