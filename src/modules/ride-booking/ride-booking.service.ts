import { prisma } from '../../config/index.js';
import { BookingStatus, RideStatus, Prisma } from '@prisma/client';
import {
    CreateBookingInput,
    BookingResponse,
    BookingListResponse,
    ListBookingsQuery,
} from './ride-booking.types.js';

/* ================= CREATE BOOKING ================= */
export const createBooking = async (
    passengerId: string,
    input: CreateBookingInput
): Promise<BookingResponse> => {
    const { rideId, seatsBooked, luggageCount = 0, pickupWaypointId, dropoffWaypointId, notes } = input;

    // Use transaction for atomic seat reservation
    return prisma.$transaction(async (tx) => {
        // Get ride with lock for update (pessimistic locking)
        const ride = await tx.ride.findFirst({
            where: {
                id: rideId,
                status: RideStatus.PUBLISHED,
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        if (!ride) {
            throw new Error('RIDE_NOT_FOUND');
        }

        // Check if passenger is trying to book their own ride
        if (ride.driverId === passengerId) {
            throw new Error('CANNOT_BOOK_OWN_RIDE');
        }

        // Check seat availability
        if (ride.availableSeats < seatsBooked) {
            throw new Error('INSUFFICIENT_SEATS');
        }

        // Check for existing pending/confirmed booking by same user
        const existingBooking = await tx.rideBooking.findFirst({
            where: {
                rideId,
                passengerId,
                status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
            },
        });

        if (existingBooking) {
            throw new Error('BOOKING_ALREADY_EXISTS');
        }

        // Calculate total price
        let totalPrice = ride.basePricePerSeat * seatsBooked;

        // If custom waypoint prices exist, use them
        if (pickupWaypointId || dropoffWaypointId) {
            const waypoints = await tx.rideWaypoint.findMany({
                where: {
                    id: { in: [pickupWaypointId, dropoffWaypointId].filter(Boolean) as string[] },
                },
            });

            const pickupWaypoint = waypoints.find((wp) => wp.id === pickupWaypointId);
            const dropoffWaypoint = waypoints.find((wp) => wp.id === dropoffWaypointId);

            if (pickupWaypoint?.pricePerSeat || dropoffWaypoint?.pricePerSeat) {
                // Use waypoint-specific pricing if available
                const waypointPrice =
                    pickupWaypoint?.pricePerSeat || dropoffWaypoint?.pricePerSeat || ride.basePricePerSeat;
                totalPrice = waypointPrice * seatsBooked;
            }
        }

        // Create booking
        const booking = await tx.rideBooking.create({
            data: {
                rideId,
                passengerId,
                seatsBooked,
                totalPrice,
                pickupWaypointId,
                dropoffWaypointId,
                status: BookingStatus.PENDING,
            },
            include: {
                ride: {
                    include: {
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });

        // Reserve seats (decrement available seats)
        await tx.ride.update({
            where: { id: rideId },
            data: {
                availableSeats: { decrement: seatsBooked },
            },
        });

        return {
            id: booking.id,
            rideId: booking.rideId,
            passengerId: booking.passengerId,
            seatsBooked: booking.seatsBooked,
            luggageCount,
            totalPrice: booking.totalPrice,
            status: booking.status,
            pickupWaypointId: booking.pickupWaypointId,
            dropoffWaypointId: booking.dropoffWaypointId,
            notes: notes || null,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            ride: {
                id: booking.ride.id,
                originAddress: booking.ride.originAddress,
                destinationAddress: booking.ride.destinationAddress,
                departureDate: booking.ride.departureDate,
                departureTime: booking.ride.departureTime,
                basePricePerSeat: booking.ride.basePricePerSeat,
                currency: booking.ride.currency,
                driver: booking.ride.driver,
            },
        };
    });
};

/* ================= CONFIRM BOOKING ================= */
export const confirmBooking = async (
    passengerId: string,
    bookingId: string
): Promise<BookingResponse> => {
    const booking = await prisma.rideBooking.findFirst({
        where: {
            id: bookingId,
            passengerId,
            status: BookingStatus.PENDING,
        },
        include: {
            ride: {
                include: {
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    });

    if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
    }

    const updatedBooking = await prisma.rideBooking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
        include: {
            ride: {
                include: {
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    });

    return {
        id: updatedBooking.id,
        rideId: updatedBooking.rideId,
        passengerId: updatedBooking.passengerId,
        seatsBooked: updatedBooking.seatsBooked,
        luggageCount: 0,
        totalPrice: updatedBooking.totalPrice,
        status: updatedBooking.status,
        pickupWaypointId: updatedBooking.pickupWaypointId,
        dropoffWaypointId: updatedBooking.dropoffWaypointId,
        notes: null,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt,
        ride: {
            id: updatedBooking.ride.id,
            originAddress: updatedBooking.ride.originAddress,
            destinationAddress: updatedBooking.ride.destinationAddress,
            departureDate: updatedBooking.ride.departureDate,
            departureTime: updatedBooking.ride.departureTime,
            basePricePerSeat: updatedBooking.ride.basePricePerSeat,
            currency: updatedBooking.ride.currency,
            driver: updatedBooking.ride.driver,
        },
    };
};

/* ================= CANCEL BOOKING ================= */
export const cancelBooking = async (
    passengerId: string,
    bookingId: string
): Promise<void> => {
    return prisma.$transaction(async (tx) => {
        const booking = await tx.rideBooking.findFirst({
            where: {
                id: bookingId,
                passengerId,
                status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
            },
        });

        if (!booking) {
            throw new Error('BOOKING_NOT_FOUND');
        }

        // Update booking status
        await tx.rideBooking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.CANCELLED },
        });

        // Restore available seats
        await tx.ride.update({
            where: { id: booking.rideId },
            data: {
                availableSeats: { increment: booking.seatsBooked },
            },
        });
    });
};

/* ================= GET BOOKING BY ID ================= */
export const getBookingById = async (
    passengerId: string,
    bookingId: string
): Promise<BookingResponse | null> => {
    const booking = await prisma.rideBooking.findFirst({
        where: {
            id: bookingId,
            passengerId,
        },
        include: {
            ride: {
                include: {
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    });

    if (!booking) return null;

    return {
        id: booking.id,
        rideId: booking.rideId,
        passengerId: booking.passengerId,
        seatsBooked: booking.seatsBooked,
        luggageCount: 0,
        totalPrice: booking.totalPrice,
        status: booking.status,
        pickupWaypointId: booking.pickupWaypointId,
        dropoffWaypointId: booking.dropoffWaypointId,
        notes: null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        ride: {
            id: booking.ride.id,
            originAddress: booking.ride.originAddress,
            destinationAddress: booking.ride.destinationAddress,
            departureDate: booking.ride.departureDate,
            departureTime: booking.ride.departureTime,
            basePricePerSeat: booking.ride.basePricePerSeat,
            currency: booking.ride.currency,
            driver: booking.ride.driver,
        },
    };
};

/* ================= LIST USER BOOKINGS ================= */
export const listUserBookings = async (
    passengerId: string,
    query: ListBookingsQuery
): Promise<BookingListResponse> => {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RideBookingWhereInput = {
        passengerId,
        ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
        prisma.rideBooking.findMany({
            where,
            include: {
                ride: {
                    include: {
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.rideBooking.count({ where }),
    ]);

    return {
        bookings: bookings.map((booking) => ({
            id: booking.id,
            rideId: booking.rideId,
            passengerId: booking.passengerId,
            seatsBooked: booking.seatsBooked,
            luggageCount: 0,
            totalPrice: booking.totalPrice,
            status: booking.status,
            pickupWaypointId: booking.pickupWaypointId,
            dropoffWaypointId: booking.dropoffWaypointId,
            notes: null,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            ride: {
                id: booking.ride.id,
                originAddress: booking.ride.originAddress,
                destinationAddress: booking.ride.destinationAddress,
                departureDate: booking.ride.departureDate,
                departureTime: booking.ride.departureTime,
                basePricePerSeat: booking.ride.basePricePerSeat,
                currency: booking.ride.currency,
                driver: booking.ride.driver,
            },
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
