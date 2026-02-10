import { BookingStatus } from '@prisma/client';

/* ================= CREATE BOOKING INPUT ================= */
export interface CreateBookingInput {
    rideId: string;
    seatsBooked: number;
    luggageCount?: number;
    pickupWaypointId?: string;
    dropoffWaypointId?: string;
    notes?: string;
}

/* ================= CONFIRM BOOKING INPUT ================= */
export interface ConfirmBookingInput {
    paymentMethodId?: string;
}

/* ================= BOOKING RESPONSE ================= */
export interface BookingResponse {
    id: string;
    rideId: string;
    passengerId: string;
    seatsBooked: number;
    luggageCount: number;
    totalPrice: number;
    status: BookingStatus;
    pickupWaypointId: string | null;
    dropoffWaypointId: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    ride?: {
        id: string;
        originAddress: string;
        destinationAddress: string;
        departureDate: Date;
        departureTime: string;
        basePricePerSeat: number;
        currency: string;
        driver: {
            id: string;
            name: string | null;
            avatarUrl: string | null;
        };
    };
}

/* ================= BOOKING LIST RESPONSE ================= */
export interface BookingListResponse {
    bookings: BookingResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/* ================= LIST BOOKINGS QUERY ================= */
export interface ListBookingsQuery {
    status?: BookingStatus;
    page?: number;
    limit?: number;
}
