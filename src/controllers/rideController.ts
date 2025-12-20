import { Request, Response } from 'express';
import Ride from '../models/Ride';

export const createRide = async (req: Request, res: Response) => {
    try {
        const { origin, destination, departureTime, seats, price, preferences } = req.body;

        const ride = await Ride.create({
            driver: (req as any).user.id,
            origin,
            destination,
            departureTime,
            seats,
            availableSeats: seats,
            price,
            preferences,
        });

        res.status(201).json(ride);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getRides = async (req: Request, res: Response) => {
    try {
        const { originLat, originLng, destLat, destLng, date } = req.query;

        const query: any = { status: 'published', availableSeats: { $gt: 0 } };

        if (date) {
            const startDate = new Date(date as string);
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
                        coordinates: [parseFloat(originLng as string), parseFloat(originLat as string)],
                    },
                    $maxDistance: 5000, // 5km radius
                },
            };
        }

        const rides = await Ride.find(query).populate('driver', 'name avatar rating');
        res.json(rides);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const joinRide = async (req: Request, res: Response) => {
    try {
        const rideId = req.params.id;
        const userId = (req as any).user.id;

        // Optimistic concurrency control
        const ride = await Ride.findOneAndUpdate(
            { _id: rideId, availableSeats: { $gt: 0 } },
            {
                $inc: { availableSeats: -1 },
                $push: { passengers: userId }
            },
            { new: true }
        );

        if (!ride) {
            return res.status(400).json({ message: 'Ride full or not found' });
        }

        res.json(ride);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
