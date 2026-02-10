import { Response } from 'express';
import * as BookingService from './ride-booking.service.js';
import { AuthRequest } from '../../middlewares/authMiddleware.js';
import { sendSuccess, sendError, HttpStatus } from '../../utils/index.js';
import { deleteCache, getCache, setCache } from '../../services/cache.service.js';

// Cache key helpers
const cacheKeys = {
    booking: (id: string) => `booking:${id}`,
    userBookings: (userId: string) => `user:${userId}:bookings`,
    rideDetails: (id: string) => `ride:details:${id}`,
};

/* ================= CREATE BOOKING ================= */
export const createBooking = async (req: AuthRequest, res: Response) => {
    try {
        const booking = await BookingService.createBooking(req.user.id, req.body);

        // Invalidate related caches
        await deleteCache(cacheKeys.userBookings(req.user.id));
        await deleteCache(cacheKeys.rideDetails(req.body.rideId));

        return sendSuccess(res, {
            status: HttpStatus.CREATED,
            message: 'Booking created successfully',
            data: booking,
        });
    } catch (error: any) {
        let status = HttpStatus.INTERNAL_ERROR;
        let message = 'Failed to create booking';

        switch (error.message) {
            case 'RIDE_NOT_FOUND':
                status = HttpStatus.NOT_FOUND;
                message = 'Ride not found or not available';
                break;
            case 'CANNOT_BOOK_OWN_RIDE':
                status = HttpStatus.BAD_REQUEST;
                message = 'You cannot book your own ride';
                break;
            case 'INSUFFICIENT_SEATS':
                status = HttpStatus.BAD_REQUEST;
                message = 'Not enough seats available';
                break;
            case 'BOOKING_ALREADY_EXISTS':
                status = HttpStatus.CONFLICT;
                message = 'You already have a booking for this ride';
                break;
        }

        return sendError(res, { status, message });
    }
};

/* ================= CONFIRM BOOKING ================= */
export const confirmBooking = async (req: AuthRequest, res: Response) => {
    try {
        const bookingId = req.params.id as string;
        const booking = await BookingService.confirmBooking(req.user.id, bookingId);

        // Invalidate caches
        await deleteCache(cacheKeys.booking(bookingId));
        await deleteCache(cacheKeys.userBookings(req.user.id));

        return sendSuccess(res, {
            message: 'Booking confirmed successfully',
            data: booking,
        });
    } catch (error: any) {
        const status = error.message === 'BOOKING_NOT_FOUND'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.INTERNAL_ERROR;

        return sendError(res, {
            status,
            message: error.message === 'BOOKING_NOT_FOUND'
                ? 'Booking not found or cannot be confirmed'
                : 'Failed to confirm booking',
        });
    }
};

/* ================= CANCEL BOOKING ================= */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
    try {
        const bookingId = req.params.id as string;
        await BookingService.cancelBooking(req.user.id, bookingId);

        // Invalidate caches
        await deleteCache(cacheKeys.booking(bookingId));
        await deleteCache(cacheKeys.userBookings(req.user.id));

        return sendSuccess(res, {
            message: 'Booking cancelled successfully',
        });
    } catch (error: any) {
        const status = error.message === 'BOOKING_NOT_FOUND'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.INTERNAL_ERROR;

        return sendError(res, {
            status,
            message: error.message === 'BOOKING_NOT_FOUND'
                ? 'Booking not found or cannot be cancelled'
                : 'Failed to cancel booking',
        });
    }
};

/* ================= GET BOOKING BY ID ================= */
export const getBookingById = async (req: AuthRequest, res: Response) => {
    try {
        const bookingId = req.params.id as string;
        const cacheKey = cacheKeys.booking(bookingId);

        // Try cache first
        const cachedBooking = await getCache(cacheKey);
        if (cachedBooking) {
            return sendSuccess(res, {
                message: 'Booking fetched successfully',
                data: cachedBooking,
            });
        }

        const booking = await BookingService.getBookingById(req.user.id, bookingId);

        if (!booking) {
            return sendError(res, {
                status: HttpStatus.NOT_FOUND,
                message: 'Booking not found',
            });
        }

        // Cache the result
        await setCache(cacheKey, booking);

        return sendSuccess(res, {
            message: 'Booking fetched successfully',
            data: booking,
        });
    } catch (error: any) {
        return sendError(res, {
            status: HttpStatus.INTERNAL_ERROR,
            message: 'Failed to fetch booking',
        });
    }
};

/* ================= LIST USER BOOKINGS ================= */
export const listUserBookings = async (req: AuthRequest, res: Response) => {
    try {
        const result = await BookingService.listUserBookings(req.user.id, req.query as any);

        return sendSuccess(res, {
            message: 'Bookings fetched successfully',
            data: result,
        });
    } catch (error: any) {
        return sendError(res, {
            status: HttpStatus.INTERNAL_ERROR,
            message: 'Failed to fetch bookings',
        });
    }
};
