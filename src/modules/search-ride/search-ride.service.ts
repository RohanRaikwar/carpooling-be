import { prisma } from '../../config/index.js';
import { RideStatus, Prisma } from '@prisma/client';
import {
    SearchRideQuery,
    SearchRideResult,
    SearchRideResponse,
    RideDetailsResponse,
    EnhancedSearchRideQuery,
    EnhancedSearchRideResult,
    EnhancedSearchRideResponse,
    RideMatchType,
    MatchDetails,
    MatchedStopover,
    WaypointMatch,
    WaypointInfo,
} from './search-ride.types.js';

import {
    calculateHaversineDistance as haversine,
    decodePolyline,
    isPointOnRoute,
    isRouteCovered,
    calculatePolylineSimilarity,
    getBoundingBox,
    mergeBoundingBoxes,
    LatLng,
} from './polyline.utils.js';

/* ================= BASIC SEARCH RIDES ================= */
export const searchRides = async (
    query: SearchRideQuery
): Promise<SearchRideResponse> => {
    const {
        departureDate,
        departureTime,
        maxPrice,
        femaleOnly,
        sortBy = 'departure',
        sortOrder = 'asc',
    } = query;

    // Parse ALL numeric query params — req.query values arrive as strings
    const originLat = Number(query.originLat);
    const originLng = Number(query.originLng);
    const destinationLat = Number(query.destinationLat);
    const destinationLng = Number(query.destinationLng);
    const seatsRequired = Number(query.seatsRequired) || 1;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const radiusKm = Number(query.radiusKm) || 5;
    const skip = (page - 1) * limit;

    // Get bounding boxes for origin and destination
    const originBB = getBoundingBox(originLat, originLng, radiusKm);
    const destBB = getBoundingBox(destinationLat, destinationLng, radiusKm);

    // Build where clause with bounding box optimization
    const whereClause: Prisma.RideWhereInput = {
        status: RideStatus.PUBLISHED,
        availableSeats: { gte: seatsRequired },
        departureDate: {
            gte: new Date(new Date(departureDate).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(departureDate).setHours(23, 59, 59, 999)),
        },
        // Bounding box filter for origin
        originLat: { gte: originBB.minLat, lte: originBB.maxLat },
        originLng: { gte: originBB.minLng, lte: originBB.maxLng },
        // Bounding box filter for destination
        destinationLat: { gte: destBB.minLat, lte: destBB.maxLat },
        destinationLng: { gte: destBB.minLng, lte: destBB.maxLng },
    };

    // Add price filter if specified
    if (maxPrice) {
        whereClause.basePricePerSeat = { lte: maxPrice };
    }

    // Get rides with driver info
    const [rides, total] = await Promise.all([
        prisma.ride.findMany({
            where: whereClause,
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: getOrderBy(sortBy, sortOrder),
            skip,
            take: limit,
        }),
        prisma.ride.count({ where: whereClause }),
    ]);

    // Calculate actual distances and filter by exact radius
    const ridesWithDistance: SearchRideResult[] = rides
        .map((ride) => {
            const distanceFromOrigin = haversine(
                { lat: originLat, lng: originLng },
                { lat: ride.originLat, lng: ride.originLng }
            );
            const distanceFromDestination = haversine(
                { lat: destinationLat, lng: destinationLng },
                { lat: ride.destinationLat, lng: ride.destinationLng }
            );

            return {
                id: ride.id,
                driverId: ride.driverId,
                driver: {
                    id: ride.driver.id,
                    name: ride.driver.name,
                    avatarUrl: ride.driver.avatarUrl,
                },
                originPlaceId: ride.originPlaceId,
                originAddress: ride.originAddress,
                originLat: ride.originLat,
                originLng: ride.originLng,
                destinationPlaceId: ride.destinationPlaceId,
                destinationAddress: ride.destinationAddress,
                destinationLat: ride.destinationLat,
                destinationLng: ride.destinationLng,
                routeDistanceMeters: ride.routeDistanceMeters,
                routeDurationSeconds: ride.routeDurationSeconds,
                departureDate: ride.departureDate,
                departureTime: ride.departureTime,
                availableSeats: ride.availableSeats,
                basePricePerSeat: ride.basePricePerSeat,
                currency: ride.currency,
                status: ride.status,
                distanceFromOrigin,
                distanceFromDestination,
            };
        })
        .filter(
            (ride) =>
                ride.distanceFromOrigin! <= radiusKm &&
                ride.distanceFromDestination! <= radiusKm
        );

    // Sort by distance if requested
    if (sortBy === 'distance') {
        ridesWithDistance.sort((a, b) => {
            const distA = (a.distanceFromOrigin || 0) + (a.distanceFromDestination || 0);
            const distB = (b.distanceFromOrigin || 0) + (b.distanceFromDestination || 0);
            return sortOrder === 'asc' ? distA - distB : distB - distA;
        });
    }

    return {
        rides: ridesWithDistance,
        pagination: {
            page,
            limit,
            total: ridesWithDistance.length,
            totalPages: Math.ceil(ridesWithDistance.length / limit),
        },
    };
};

/* ================= GET ORDER BY ================= */
const getOrderBy = (
    sortBy: string,
    sortOrder: string
): Prisma.RideOrderByWithRelationInput => {
    switch (sortBy) {
        case 'price':
            return { basePricePerSeat: sortOrder as Prisma.SortOrder };
        case 'departure':
        default:
            return { departureDate: sortOrder as Prisma.SortOrder };
    }
};

/* ================= GET RIDE DETAILS ================= */
export const getRideDetails = async (
    rideId: string
): Promise<RideDetailsResponse | null> => {
    const ride = await prisma.ride.findFirst({
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
            waypoints: {
                orderBy: { orderIndex: 'asc' },
            },
        },
    });

    if (!ride) return null;

    return {
        id: ride.id,
        driverId: ride.driverId,
        driver: {
            id: ride.driver.id,
            name: ride.driver.name,
            avatarUrl: ride.driver.avatarUrl,
        },
        originPlaceId: ride.originPlaceId,
        originAddress: ride.originAddress,
        originLat: ride.originLat,
        originLng: ride.originLng,
        destinationPlaceId: ride.destinationPlaceId,
        destinationAddress: ride.destinationAddress,
        destinationLat: ride.destinationLat,
        destinationLng: ride.destinationLng,
        routeDistanceMeters: ride.routeDistanceMeters,
        routeDurationSeconds: ride.routeDurationSeconds,
        departureDate: ride.departureDate,
        departureTime: ride.departureTime,
        totalSeats: ride.totalSeats,
        availableSeats: ride.availableSeats,
        basePricePerSeat: ride.basePricePerSeat,
        currency: ride.currency,
        status: ride.status,
        notes: ride.notes,
        waypoints: ride.waypoints.map((wp) => ({
            id: wp.id,
            placeId: wp.placeId,
            address: wp.address,
            lat: wp.lat,
            lng: wp.lng,
            waypointType: wp.waypointType,
            orderIndex: wp.orderIndex,
            pricePerSeat: wp.pricePerSeat,
        })),
    };
};

/* ================= SAVE RECENT SEARCH ================= */
export const saveRecentSearch = async (
    userId: string,
    originAddress: string,
    originLat: number,
    originLng: number,
    destinationAddress: string,
    destinationLat: number,
    destinationLng: number
) => {
    // Can be stored in Redis or a RecentSearch model later
};

/* ================= CREATE RIDE ALERT ================= */
export const createRideAlert = async (
    userId: string,
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    departureDate: Date,
    radiusKm: number
) => {
    return {
        success: true,
        message: 'Alert created. You will be notified when matching rides are available.',
    };
};

/* ========================================================================
   ADVANCED SEARCH — 4-CONDITION GEO-MATCHING
   ========================================================================

   Passenger provides: origin (lat/lng), destination (lat/lng), polyline (optional)

   Condition 1 — EXACT_MATCH (Score: 100)
     Passenger origin ≤ radiusKm of Driver origin
     AND Passenger destination ≤ radiusKm of Driver destination

   Condition 2 — STOPOVER_PICKUP (Score: 80)
     Passenger origin ≤ radiusKm of a Driver stopover/waypoint
     AND Passenger destination ≤ radiusKm of Driver destination

   Condition 3 — STOPOVER_DROPOFF (Score: 70)
     Passenger origin ≤ radiusKm of Driver origin
     AND Passenger destination ≤ radiusKm of a Driver stopover/waypoint

   Condition 4 — ALTERNATE_ROUTE (Score: 60)
     Any match via stopovers/origin/dest cross-combinations
     OR polyline similarity between 20%-75% (different route, same corridor)

   ======================================================================== */

/* ================= ADVANCED SEARCH RIDES ================= */
export const searchRidesAdvanced = async (
    query: EnhancedSearchRideQuery
): Promise<EnhancedSearchRideResponse> => {
    const {
        departureDate,
        maxPrice,
        sortBy = 'departure',
        sortOrder = 'asc',
        userRoutePolyline,
        includeAlternates = true,
    } = query;

    // Parse ALL numeric query params — req.query values arrive as strings
    const originLat = Number(query.originLat);
    const originLng = Number(query.originLng);
    const destinationLat = Number(query.destinationLat);
    const destinationLng = Number(query.destinationLng);
    const seatsRequired = Number(query.seatsRequired) || 1;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const radiusKm = Number(query.radiusKm) || 5;
    const minSimilarity = Number(query.minSimilarity) || 0.75;
    const skip = (page - 1) * limit;

    const passengerOrigin: LatLng = { lat: originLat, lng: originLng };
    const passengerDest: LatLng = { lat: destinationLat, lng: destinationLng };

    /* ------------------------------------------------------------------
       Phase 1: Spatial pre-filtering with expanded bounding box
       We use 2× radius so we can catch rides where stopovers match
       ------------------------------------------------------------------ */
    const expandedRadius = radiusKm * 2;
    const originBB = getBoundingBox(originLat, originLng, expandedRadius);
    const destBB = getBoundingBox(destinationLat, destinationLng, expandedRadius);
    const mergedBB = mergeBoundingBoxes([originBB, destBB]);

    const whereClause: Prisma.RideWhereInput = {
        status: RideStatus.PUBLISHED,
        availableSeats: { gte: seatsRequired },
        departureDate: {
            gte: new Date(new Date(departureDate).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(departureDate).setHours(23, 59, 59, 999)),
        },
        OR: [
            // Rides whose origin is in our search area
            {
                originLat: { gte: mergedBB.minLat, lte: mergedBB.maxLat },
                originLng: { gte: mergedBB.minLng, lte: mergedBB.maxLng },
            },
            // Rides whose destination is in our search area
            {
                destinationLat: { gte: mergedBB.minLat, lte: mergedBB.maxLat },
                destinationLng: { gte: mergedBB.minLng, lte: mergedBB.maxLng },
            },
            // Rides with waypoints/stopovers in our search area
            {
                waypoints: {
                    some: {
                        lat: { gte: mergedBB.minLat, lte: mergedBB.maxLat },
                        lng: { gte: mergedBB.minLng, lte: mergedBB.maxLng },
                    },
                },
            },
        ],
    };

    if (maxPrice) {
        whereClause.basePricePerSeat = { lte: maxPrice };
    }

    // Fetch candidate rides with waypoints
    console.log('🔍 WHERE CLAUSE:', JSON.stringify(whereClause, null, 2));
    const candidateRides = await prisma.ride.findMany({
        where: whereClause,
        include: {
            driver: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            waypoints: {
                orderBy: { orderIndex: 'asc' },
            },
        },
        take: 200, // Cap for performance
    });

    console.log('🔍 SEARCH DEBUG:', {
        originLat, originLng, destinationLat, destinationLng,
        radiusKm, expandedRadius,
        mergedBB,
        departureDate,
        dateRange: {
            gte: new Date(new Date(departureDate).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(departureDate).setHours(23, 59, 59, 999)),
        },
        candidateCount: candidateRides.length,
    });

    /* ------------------------------------------------------------------
       Phase 2: Evaluate all 4 conditions for each candidate ride
       ------------------------------------------------------------------ */
    const evaluatedRides: EnhancedSearchRideResult[] = [];

    for (const ride of candidateRides) {
        const driverOrigin: LatLng = { lat: ride.originLat, lng: ride.originLng };
        const driverDest: LatLng = { lat: ride.destinationLat, lng: ride.destinationLng };

        // Pre-compute distances
        const originToDriverOrigin = haversine(passengerOrigin, driverOrigin);
        const destToDriverDest = haversine(passengerDest, driverDest);

        // Pre-compute stopover distances
        const stoverDistances = ride.waypoints.map((wp) => ({
            waypoint: wp,
            originDist: haversine(passengerOrigin, { lat: wp.lat, lng: wp.lng }),
            destDist: haversine(passengerDest, { lat: wp.lat, lng: wp.lng }),
        }));

        // ── Condition 1: EXACT_MATCH ──
        const c1 = evaluateCondition1(originToDriverOrigin, destToDriverDest, radiusKm);

        // ── Condition 2: STOPOVER_PICKUP ──
        const c2 = evaluateCondition2(stoverDistances, destToDriverDest, radiusKm);

        // ── Condition 3: STOPOVER_DROPOFF ──
        const c3 = evaluateCondition3(stoverDistances, originToDriverOrigin, radiusKm);

        // ── Condition 4: ALTERNATE_ROUTE ──
        const c4 = evaluateCondition4(
            passengerOrigin,
            passengerDest,
            driverOrigin,
            driverDest,
            stoverDistances,
            radiusKm,
            userRoutePolyline,
            ride.routePolyline,
            minSimilarity
        );

        // Determine the BEST match (highest priority: C1 > C2 > C3 > C4)
        let matchType: RideMatchType | null = null;
        let matchScore = 0;
        let matchedStopover: MatchedStopover | undefined;
        let pickupPoint: { lat: number; lng: number; address?: string } | undefined;
        let dropoffPoint: { lat: number; lng: number; address?: string } | undefined;
        let polylineSimilarity: number | undefined;

        if (c1.isMatch) {
            matchType = RideMatchType.EXACT_MATCH;
            matchScore = calculateMatchScore(originToDriverOrigin, destToDriverDest, undefined, 100);
            pickupPoint = { lat: driverOrigin.lat, lng: driverOrigin.lng };
            dropoffPoint = { lat: driverDest.lat, lng: driverDest.lng };
        } else if (c2.isMatch) {
            matchType = RideMatchType.STOPOVER_PICKUP;
            matchScore = calculateMatchScore(c2.stopoverDist!, destToDriverDest, undefined, 80);
            matchedStopover = c2.matchedStopover;
            pickupPoint = matchedStopover
                ? { lat: matchedStopover.lat, lng: matchedStopover.lng, address: matchedStopover.address }
                : undefined;
            dropoffPoint = { lat: driverDest.lat, lng: driverDest.lng };
        } else if (c3.isMatch) {
            matchType = RideMatchType.STOPOVER_DROPOFF;
            matchScore = calculateMatchScore(originToDriverOrigin, c3.stopoverDist!, undefined, 70);
            matchedStopover = c3.matchedStopover;
            pickupPoint = { lat: driverOrigin.lat, lng: driverOrigin.lng };
            dropoffPoint = matchedStopover
                ? { lat: matchedStopover.lat, lng: matchedStopover.lng, address: matchedStopover.address }
                : undefined;
        } else if (c4.isMatch && includeAlternates) {
            matchType = RideMatchType.ALTERNATE_ROUTE;
            matchScore = calculateMatchScore(
                originToDriverOrigin,
                destToDriverDest,
                c4.similarity,
                60
            );
            polylineSimilarity = c4.similarity;
            matchedStopover = c4.matchedStopover;
            pickupPoint = c4.pickupPoint;
            dropoffPoint = c4.dropoffPoint;
        }

        // Skip rides that don't match any condition
        if (!matchType) continue;

        // Build waypoint match details
        const waypointMatches: WaypointMatch[] = [];
        for (const sd of stoverDistances) {
            if (sd.originDist <= radiusKm) {
                waypointMatches.push({
                    waypointId: sd.waypoint.id,
                    waypointAddress: sd.waypoint.address,
                    distanceKm: Math.round(sd.originDist * 100) / 100,
                    matchType: 'PICKUP',
                });
            }
            if (sd.destDist <= radiusKm) {
                waypointMatches.push({
                    waypointId: sd.waypoint.id,
                    waypointAddress: sd.waypoint.address,
                    distanceKm: Math.round(sd.destDist * 100) / 100,
                    matchType: 'DROPOFF',
                });
            }
        }

        // Build match details object
        const matchDetails: MatchDetails = {
            originMatch: originToDriverOrigin <= radiusKm,
            originDistanceKm: Math.round(originToDriverOrigin * 100) / 100,
            destinationMatch: destToDriverDest <= radiusKm,
            destinationDistanceKm: Math.round(destToDriverDest * 100) / 100,
            matchedStopover,
            waypointMatches: waypointMatches.length > 0 ? waypointMatches : undefined,
            polylineSimilarity,
            isAlternateRoute: matchType === RideMatchType.ALTERNATE_ROUTE,
            pickupPoint,
            dropoffPoint,
        };

        // Collect relevant waypoints near the passenger's origin/destination
        const relevantWaypoints: WaypointInfo[] = ride.waypoints
            .filter((wp) => {
                const wpLoc: LatLng = { lat: wp.lat, lng: wp.lng };
                return (
                    haversine(passengerOrigin, wpLoc) <= radiusKm ||
                    haversine(passengerDest, wpLoc) <= radiusKm
                );
            })
            .map((wp) => ({
                id: wp.id,
                placeId: wp.placeId,
                address: wp.address,
                lat: wp.lat,
                lng: wp.lng,
                waypointType: wp.waypointType,
                orderIndex: wp.orderIndex,
                pricePerSeat: wp.pricePerSeat,
            }));

        evaluatedRides.push({
            id: ride.id,
            driverId: ride.driverId,
            driver: {
                id: ride.driver.id,
                name: ride.driver.name,
                avatarUrl: ride.driver.avatarUrl,
            },
            originPlaceId: ride.originPlaceId,
            originAddress: ride.originAddress,
            originLat: ride.originLat,
            originLng: ride.originLng,
            destinationPlaceId: ride.destinationPlaceId,
            destinationAddress: ride.destinationAddress,
            destinationLat: ride.destinationLat,
            destinationLng: ride.destinationLng,
            routeDistanceMeters: ride.routeDistanceMeters,
            routeDurationSeconds: ride.routeDurationSeconds,
            routePolyline: ride.routePolyline,
            departureDate: ride.departureDate,
            departureTime: ride.departureTime,
            availableSeats: ride.availableSeats,
            basePricePerSeat: ride.basePricePerSeat,
            currency: ride.currency,
            status: ride.status,
            distanceFromOrigin: originToDriverOrigin,
            distanceFromDestination: destToDriverDest,
            matchType,
            matchScore,
            matchDetails,
            relevantWaypoints,
        });
    }

    /* ------------------------------------------------------------------
       Phase 3: Sort, group, and paginate
       ------------------------------------------------------------------ */
    evaluatedRides.sort((a, b) => {
        // Primary: match score descending
        if (a.matchScore !== b.matchScore) {
            return b.matchScore - a.matchScore;
        }
        // Secondary: user-specified sort
        if (sortBy === 'price') {
            return sortOrder === 'asc'
                ? a.basePricePerSeat - b.basePricePerSeat
                : b.basePricePerSeat - a.basePricePerSeat;
        }
        if (sortBy === 'distance') {
            const distA = (a.distanceFromOrigin || 0) + (a.distanceFromDestination || 0);
            const distB = (b.distanceFromOrigin || 0) + (b.distanceFromDestination || 0);
            return sortOrder === 'asc' ? distA - distB : distB - distA;
        }
        // Default: departure time
        return sortOrder === 'asc'
            ? new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
            : new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime();
    });

    // Group by match type
    const grouped = {
        exactMatches: evaluatedRides.filter((r) => r.matchType === RideMatchType.EXACT_MATCH),
        stopoverPickups: evaluatedRides.filter((r) => r.matchType === RideMatchType.STOPOVER_PICKUP),
        stopoverDropoffs: evaluatedRides.filter((r) => r.matchType === RideMatchType.STOPOVER_DROPOFF),
        alternateRoutes: evaluatedRides.filter((r) => r.matchType === RideMatchType.ALTERNATE_ROUTE),
    };

    // Apply pagination
    const paginatedRides = evaluatedRides.slice(skip, skip + limit);

    return {
        rides: paginatedRides,
        grouped,
        pagination: {
            page,
            limit,
            total: evaluatedRides.length,
            totalPages: Math.ceil(evaluatedRides.length / limit),
        },
    };
};

/* ========================================================================
   CONDITION EVALUATION HELPERS
   ======================================================================== */

// Reusable type for pre-computed stopover distances
interface StopoverDistance {
    waypoint: {
        id: string;
        address: string;
        lat: number;
        lng: number;
        waypointType: string;
        orderIndex: number;
        pricePerSeat: number | null;
    };
    originDist: number; // haversine from passenger origin to this waypoint
    destDist: number;   // haversine from passenger dest to this waypoint
}

/* ──────────────────────────────────────────────────────────────────────────
   Condition 1 — EXACT_MATCH
   Passenger origin ≤ radiusKm of Driver origin
   AND Passenger destination ≤ radiusKm of Driver destination
   ────────────────────────────────────────────────────────────────────────── */
interface Condition1Result {
    isMatch: boolean;
}

const evaluateCondition1 = (
    originToDriverOrigin: number,
    destToDriverDest: number,
    radiusKm: number
): Condition1Result => {
    return {
        isMatch: originToDriverOrigin <= radiusKm && destToDriverDest <= radiusKm,
    };
};

/* ──────────────────────────────────────────────────────────────────────────
   Condition 2 — STOPOVER_PICKUP
   Passenger origin ≤ radiusKm of a Driver stopover/waypoint
   AND Passenger destination ≤ radiusKm of Driver destination
   ────────────────────────────────────────────────────────────────────────── */
interface Condition2Result {
    isMatch: boolean;
    matchedStopover?: MatchedStopover;
    stopoverDist?: number;
}

const evaluateCondition2 = (
    stoverDistances: StopoverDistance[],
    destToDriverDest: number,
    radiusKm: number
): Condition2Result => {
    // Destination must match driver's destination
    if (destToDriverDest > radiusKm) {
        return { isMatch: false };
    }

    // Find the closest stopover to passenger's origin
    let bestMatch: StopoverDistance | null = null;
    let bestDist = Infinity;

    for (const sd of stoverDistances) {
        if (sd.originDist <= radiusKm && sd.originDist < bestDist) {
            bestDist = sd.originDist;
            bestMatch = sd;
        }
    }

    if (!bestMatch) {
        return { isMatch: false };
    }

    return {
        isMatch: true,
        stopoverDist: bestDist,
        matchedStopover: {
            id: bestMatch.waypoint.id,
            address: bestMatch.waypoint.address,
            lat: bestMatch.waypoint.lat,
            lng: bestMatch.waypoint.lng,
            distanceKm: Math.round(bestDist * 100) / 100,
            matchRole: 'PICKUP',
        },
    };
};

/* ──────────────────────────────────────────────────────────────────────────
   Condition 3 — STOPOVER_DROPOFF
   Passenger origin ≤ radiusKm of Driver origin
   AND Passenger destination ≤ radiusKm of a Driver stopover/waypoint
   ────────────────────────────────────────────────────────────────────────── */
interface Condition3Result {
    isMatch: boolean;
    matchedStopover?: MatchedStopover;
    stopoverDist?: number;
}

const evaluateCondition3 = (
    stoverDistances: StopoverDistance[],
    originToDriverOrigin: number,
    radiusKm: number
): Condition3Result => {
    // Origin must match driver's origin
    if (originToDriverOrigin > radiusKm) {
        return { isMatch: false };
    }

    // Find the closest stopover to passenger's destination
    let bestMatch: StopoverDistance | null = null;
    let bestDist = Infinity;

    for (const sd of stoverDistances) {
        if (sd.destDist <= radiusKm && sd.destDist < bestDist) {
            bestDist = sd.destDist;
            bestMatch = sd;
        }
    }

    if (!bestMatch) {
        return { isMatch: false };
    }

    return {
        isMatch: true,
        stopoverDist: bestDist,
        matchedStopover: {
            id: bestMatch.waypoint.id,
            address: bestMatch.waypoint.address,
            lat: bestMatch.waypoint.lat,
            lng: bestMatch.waypoint.lng,
            distanceKm: Math.round(bestDist * 100) / 100,
            matchRole: 'DROPOFF',
        },
    };
};

/* ──────────────────────────────────────────────────────────────────────────
   Condition 4 — ALTERNATE_ROUTE
   Any stopovers/origin/dest cross-match + polyline similarity 20%-75%
   OR passenger origin/dest matches driver stopovers in unusual combos
   ────────────────────────────────────────────────────────────────────────── */
interface Condition4Result {
    isMatch: boolean;
    similarity?: number;
    matchedStopover?: MatchedStopover;
    pickupPoint?: { lat: number; lng: number; address?: string };
    dropoffPoint?: { lat: number; lng: number; address?: string };
}

const evaluateCondition4 = (
    passengerOrigin: LatLng,
    passengerDest: LatLng,
    driverOrigin: LatLng,
    driverDest: LatLng,
    stoverDistances: StopoverDistance[],
    radiusKm: number,
    userPolyline: string | undefined,
    driverPolyline: string | null | undefined,
    minSimilarity: number
): Condition4Result => {
    // Sub-check A: Cross-matching via stopovers
    // Passenger origin → Driver stopover AND Passenger dest → another Driver stopover
    let pickupStopover: StopoverDistance | null = null;
    let dropoffStopover: StopoverDistance | null = null;

    for (const sd of stoverDistances) {
        if (sd.originDist <= radiusKm && (!pickupStopover || sd.originDist < pickupStopover.originDist)) {
            pickupStopover = sd;
        }
        if (sd.destDist <= radiusKm && (!dropoffStopover || sd.destDist < dropoffStopover.destDist)) {
            dropoffStopover = sd;
        }
    }

    // Check cross-stopover match (both origin and dest match different stopovers)
    if (
        pickupStopover &&
        dropoffStopover &&
        pickupStopover.waypoint.id !== dropoffStopover.waypoint.id &&
        pickupStopover.waypoint.orderIndex < dropoffStopover.waypoint.orderIndex
    ) {
        return {
            isMatch: true,
            matchedStopover: {
                id: pickupStopover.waypoint.id,
                address: pickupStopover.waypoint.address,
                lat: pickupStopover.waypoint.lat,
                lng: pickupStopover.waypoint.lng,
                distanceKm: Math.round(pickupStopover.originDist * 100) / 100,
                matchRole: 'PICKUP',
            },
            pickupPoint: {
                lat: pickupStopover.waypoint.lat,
                lng: pickupStopover.waypoint.lng,
                address: pickupStopover.waypoint.address,
            },
            dropoffPoint: {
                lat: dropoffStopover.waypoint.lat,
                lng: dropoffStopover.waypoint.lng,
                address: dropoffStopover.waypoint.address,
            },
        };
    }

    // Sub-check B: Passenger origin → Driver stopover, Passenger dest → Driver origin (reverse-ish)
    // Sub-check C: Passenger origin → Driver dest, Passenger dest → Driver stopover
    const originToDriverDest = haversine(passengerOrigin, driverDest);
    const destToDriverOrigin = haversine(passengerDest, driverOrigin);

    // Passenger origin near stopover + dest near driver origin
    if (pickupStopover && destToDriverOrigin <= radiusKm) {
        return {
            isMatch: true,
            matchedStopover: {
                id: pickupStopover.waypoint.id,
                address: pickupStopover.waypoint.address,
                lat: pickupStopover.waypoint.lat,
                lng: pickupStopover.waypoint.lng,
                distanceKm: Math.round(pickupStopover.originDist * 100) / 100,
                matchRole: 'PICKUP',
            },
            pickupPoint: {
                lat: pickupStopover.waypoint.lat,
                lng: pickupStopover.waypoint.lng,
                address: pickupStopover.waypoint.address,
            },
            dropoffPoint: { lat: driverOrigin.lat, lng: driverOrigin.lng },
        };
    }

    // Passenger dest near stopover + origin near driver dest
    if (dropoffStopover && originToDriverDest <= radiusKm) {
        return {
            isMatch: true,
            matchedStopover: {
                id: dropoffStopover.waypoint.id,
                address: dropoffStopover.waypoint.address,
                lat: dropoffStopover.waypoint.lat,
                lng: dropoffStopover.waypoint.lng,
                distanceKm: Math.round(dropoffStopover.destDist * 100) / 100,
                matchRole: 'DROPOFF',
            },
            pickupPoint: { lat: driverDest.lat, lng: driverDest.lng },
            dropoffPoint: {
                lat: dropoffStopover.waypoint.lat,
                lng: dropoffStopover.waypoint.lng,
                address: dropoffStopover.waypoint.address,
            },
        };
    }

    // Sub-check D: Polyline-based alternate route
    // Same general corridor but different route (similarity 20%-75%)
    if (userPolyline && driverPolyline) {
        const similarity = calculatePolylineSimilarity(userPolyline, driverPolyline);

        if (similarity >= 0.2 && similarity < minSimilarity) {
            // It's an alternate route — different path but overlapping corridor
            const originToDriverOriginDist = haversine(passengerOrigin, driverOrigin);
            const destToDriverDestDist = haversine(passengerDest, driverDest);

            // At least origin OR destination should be reasonably close
            if (originToDriverOriginDist <= radiusKm * 2 || destToDriverDestDist <= radiusKm * 2) {
                return {
                    isMatch: true,
                    similarity: Math.round(similarity * 100) / 100,
                    pickupPoint: { lat: driverOrigin.lat, lng: driverOrigin.lng },
                    dropoffPoint: { lat: driverDest.lat, lng: driverDest.lng },
                };
            }
        }
    }

    return { isMatch: false };
};

/* ──────────────────────────────────────────────────────────────────────────
   MATCH SCORE CALCULATOR
   Computes overall relevance score (0-100)
   ────────────────────────────────────────────────────────────────────────── */
const calculateMatchScore = (
    distance1Km: number,
    distance2Km: number,
    polylineSimilarity: number | undefined,
    baseScore: number
): number => {
    let score = baseScore;

    // Distance penalty: closer = better (max -20 points deduction)
    const totalDistance = distance1Km + distance2Km;
    const distancePenalty = Math.min(20, totalDistance * 2);
    score -= distancePenalty;

    // Polyline similarity bonus (max +20 points)
    if (polylineSimilarity !== undefined) {
        score += polylineSimilarity * 20;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
};
