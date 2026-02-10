import { RideStatus, BookingStatus } from '@prisma/client';

/* ================= SEARCH RIDE QUERY ================= */
export interface SearchRideQuery {
    // Origin location
    originLat: number;
    originLng: number;

    // Destination location
    destinationLat: number;
    destinationLng: number;

    // Date and time filters
    departureDate: Date;
    departureTime?: string; // Optional: HH:mm format

    // Seat requirements
    seatsRequired?: number;

    // Filter options
    femaleOnly?: boolean;
    maxPrice?: number;
    sortBy?: 'price' | 'departure' | 'distance';
    sortOrder?: 'asc' | 'desc';

    // Pagination
    page?: number;
    limit?: number;

    // Radius in kilometers for geo search
    radiusKm?: number;
}

/* ================= SEARCH RESULT ================= */
export interface SearchRideResult {
    id: string;
    driverId: string;

    // Driver info
    driver: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        rating?: number;
    };

    // Vehicle info
    vehicle?: {
        id: string;
        brand: string | null;
        model_num: string | null;
        type: string | null;
        color: string | null;
        imageUrl: string | null;
    };

    // Origin
    originPlaceId: string;
    originAddress: string;
    originLat: number;
    originLng: number;

    // Destination
    destinationPlaceId: string;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;

    // Route info
    routeDistanceMeters: number | null;
    routeDurationSeconds: number | null;

    // Schedule
    departureDate: Date;
    departureTime: string;

    // Pricing & Availability
    availableSeats: number;
    basePricePerSeat: number;
    currency: string;

    // Status
    status: RideStatus;

    // Distance from search origin/destination (km)
    distanceFromOrigin?: number;
    distanceFromDestination?: number;
}

/* ================= SEARCH RESPONSE ================= */
export interface SearchRideResponse {
    rides: SearchRideResult[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/* ================= RIDE DETAILS RESPONSE ================= */
export interface RideDetailsResponse extends SearchRideResult {
    notes: string | null;
    waypoints: WaypointInfo[];
    totalSeats: number;
}

/* ================= WAYPOINT INFO ================= */
export interface WaypointInfo {
    id: string;
    placeId: string;
    address: string;
    lat: number;
    lng: number;
    waypointType: string;
    orderIndex: number;
    pricePerSeat: number | null;
}

/* ================= RECENT SEARCH ================= */
export interface RecentSearch {
    id: string;
    userId: string;
    originAddress: string;
    originLat: number;
    originLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    searchedAt: Date;
}

/* ================= NOTIFY REQUEST ================= */
export interface NotifyRideRequest {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    departureDate: Date;
    radiusKm?: number;
}

/* ================= ENHANCED SEARCH TYPES ================= */

/**
 * 4-Condition Match type classification for search results
 *
 * C1: EXACT_MATCH       → Passenger origin ≤5km of driver origin + dest ≤5km of driver dest
 * C2: STOPOVER_PICKUP   → Passenger origin ≤5km of driver stopover + dest ≤5km of driver dest
 * C3: STOPOVER_DROPOFF  → Passenger origin ≤5km of driver origin + dest ≤5km of driver stopover
 * C4: ALTERNATE_ROUTE   → Cross-matching via stopovers/polyline with alternative routes
 */
export enum RideMatchType {
    /** C1: Passenger origin → Driver origin, Passenger dest → Driver dest (both ≤ radiusKm) */
    EXACT_MATCH = 'EXACT_MATCH',
    /** C2: Passenger origin → Driver stopover, Passenger dest → Driver dest */
    STOPOVER_PICKUP = 'STOPOVER_PICKUP',
    /** C3: Passenger origin → Driver origin, Passenger dest → Driver stopover */
    STOPOVER_DROPOFF = 'STOPOVER_DROPOFF',
    /** C4: Alternative route match via cross-matched stopovers or polyline */
    ALTERNATE_ROUTE = 'ALTERNATE_ROUTE',
}

/**
 * Waypoint match information
 */
export interface WaypointMatch {
    waypointId: string;
    waypointAddress: string;
    distanceKm: number;
    matchType: 'PICKUP' | 'DROPOFF';
}

/**
 * Matched stopover details (for C2 and C3)
 */
export interface MatchedStopover {
    id: string;
    address: string;
    lat: number;
    lng: number;
    distanceKm: number;
    /** Whether this stopover acts as the pickup or dropoff for the passenger */
    matchRole: 'PICKUP' | 'DROPOFF';
}

/**
 * Detailed match information for enhanced search
 */
export interface MatchDetails {
    originMatch: boolean;
    originDistanceKm: number;
    destinationMatch: boolean;
    destinationDistanceKm: number;
    /** The best-matched stopover (for STOPOVER_PICKUP / STOPOVER_DROPOFF) */
    matchedStopover?: MatchedStopover;
    waypointMatches?: WaypointMatch[];
    polylineSimilarity?: number;
    isAlternateRoute: boolean;
    pickupPoint?: {
        lat: number;
        lng: number;
        address?: string;
    };
    dropoffPoint?: {
        lat: number;
        lng: number;
        address?: string;
    };
}

/**
 * Enhanced search query with polyline support
 */
export interface EnhancedSearchRideQuery extends SearchRideQuery {
    /** User's preferred route polyline (encoded) */
    userRoutePolyline?: string;
    /** Minimum polyline similarity threshold 0-1 (default 0.75) */
    minSimilarity?: number;
    /** Include alternate routes in results (default true) */
    includeAlternates?: boolean;
}

/**
 * Enhanced search result with match metadata
 */
export interface EnhancedSearchRideResult extends SearchRideResult {
    /** Type of match found */
    matchType: RideMatchType;
    /** Relevance score 0-100 */
    matchScore: number;
    /** Detailed match information */
    matchDetails: MatchDetails;
    /** Waypoints applicable to user's route */
    relevantWaypoints?: WaypointInfo[];
    /** Encoded route polyline */
    routePolyline?: string | null;
}

/**
 * Enhanced search response
 */
export interface EnhancedSearchRideResponse {
    rides: EnhancedSearchRideResult[];
    /** Grouped results by match type */
    grouped?: {
        exactMatches: EnhancedSearchRideResult[];
        stopoverPickups: EnhancedSearchRideResult[];
        stopoverDropoffs: EnhancedSearchRideResult[];
        alternateRoutes: EnhancedSearchRideResult[];
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
