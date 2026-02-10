import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './ride-booking.controller.js';
import {
    createBookingSchema,
    confirmBookingSchema,
    bookingIdParamSchema,
    listBookingsQuerySchema,
} from './ride-booking.validator.js';

const router = Router();

// Create new booking
router.post(
    '/',
    validate({ body: createBookingSchema }),
    controller.createBooking
);

// List user's bookings
router.get(
    '/',
    validate({ query: listBookingsQuerySchema }),
    controller.listUserBookings
);

// Get booking by ID
router.get(
    '/:id',
    validate({ params: bookingIdParamSchema }),
    controller.getBookingById
);

// Confirm booking
router.patch(
    '/:id/confirm',
    validate({ params: bookingIdParamSchema, body: confirmBookingSchema }),
    controller.confirmBooking
);

// Cancel booking
router.delete(
    '/:id',
    validate({ params: bookingIdParamSchema }),
    controller.cancelBooking
);

export default router;
