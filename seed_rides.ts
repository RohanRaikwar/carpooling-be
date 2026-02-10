import { prisma } from './src/config/index.js';

/**
 * Seed script to create test rides for testing the Advanced Search Ride API.
 *
 * We create a test user (driver) + 4 published rides covering all 4 match conditions:
 *
 * SEARCH QUERY will use:
 *   Origin:      Connaught Place, Delhi   (28.6315, 77.2167)
 *   Destination: Noida Sector 62          (28.6270, 77.3650)
 *
 * RIDE 1 — EXACT_MATCH (C1):
 *   Origin near CP, Destination near Sec 62
 *
 * RIDE 2 — STOPOVER_PICKUP (C2):
 *   Origin far away (Gurgaon), Destination near Sec 62
 *   Has a stopover near CP (passenger can be picked up at stopover)
 *
 * RIDE 3 — STOPOVER_DROPOFF (C3):
 *   Origin near CP, Destination far away (Greater Noida)
 *   Has a stopover near Sec 62 (passenger can be dropped at stopover)
 *
 * RIDE 4 — ALTERNATE_ROUTE (C4):
 *   Origin/Destination slightly different corridor
 *   Has stopovers that cross-match with passenger origin/dest
 */
async function main() {
    // 1. Ensure test user exists
    const email = 'testdriver@example.com';
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: 'Test Driver',
                onboardingStatus: 'COMPLETED',
                isVerified: true,
            },
        });
        console.log('✅ Created test driver:', user.email, 'ID:', user.id);
    } else {
        console.log('ℹ️  Test driver exists:', user.email, 'ID:', user.id);
    }

    const driverId = user.id;
    const departureDate = new Date('2026-02-15');

    // Clean up any old test rides from this driver
    await prisma.ride.deleteMany({ where: { driverId } });
    console.log('🗑️  Cleaned up old rides');

    // ─── RIDE 1: EXACT_MATCH ────────────────────────────
    const ride1 = await prisma.ride.create({
        data: {
            driverId,
            originPlaceId: 'ChIJYSqbGhiYDDkRBxtlMR3t0I8',
            originAddress: 'Connaught Place, New Delhi',
            originLat: 28.6320,
            originLng: 77.2195,
            destinationPlaceId: 'ChIJT4wYoGXhDDkRYjCGqpAdRao',
            destinationAddress: 'Sector 62, Noida',
            destinationLat: 28.6280,
            destinationLng: 77.3640,
            departureDate,
            departureTime: '09:00',
            totalSeats: 4,
            availableSeats: 3,
            basePricePerSeat: 150,
            currency: 'INR',
            status: 'PUBLISHED',
            routeDistanceMeters: 25000,
            routeDurationSeconds: 2700,
            notes: 'Direct Delhi CP to Noida Sec 62 — test exact match',
        },
    });
    console.log('✅ Ride 1 (EXACT_MATCH):', ride1.id);

    // ─── RIDE 2: STOPOVER_PICKUP ────────────────────────
    const ride2 = await prisma.ride.create({
        data: {
            driverId,
            originPlaceId: 'ChIJhQ3DVfLtDDkRSJF3r4fxN-Y',
            originAddress: 'Cyber City, Gurgaon',
            originLat: 28.4940,    // Gurgaon — far from search origin
            originLng: 77.0880,
            destinationPlaceId: 'ChIJT4wYoGXhDDkRYjCGqpAdRao',
            destinationAddress: 'Sector 62, Noida',
            destinationLat: 28.6275,   // Near search destination
            destinationLng: 77.3655,
            departureDate,
            departureTime: '08:30',
            totalSeats: 4,
            availableSeats: 2,
            basePricePerSeat: 200,
            currency: 'INR',
            status: 'PUBLISHED',
            routeDistanceMeters: 55000,
            routeDurationSeconds: 4500,
            notes: 'Gurgaon → Noida, stops near CP — test stopover pickup',
            waypoints: {
                create: [
                    {
                        placeId: 'ChIJYSqbGhiYDDkRBxtlMR3t0I8',
                        address: 'Near Connaught Place, New Delhi',
                        lat: 28.6310,
                        lng: 77.2180,
                        waypointType: 'STOPOVER',
                        orderIndex: 1,
                        pricePerSeat: 120,
                    },
                ],
            },
        },
    });
    console.log('✅ Ride 2 (STOPOVER_PICKUP):', ride2.id);

    // ─── RIDE 3: STOPOVER_DROPOFF ───────────────────────
    const ride3 = await prisma.ride.create({
        data: {
            driverId,
            originPlaceId: 'ChIJYSqbGhiYDDkRBxtlMR3t0I8',
            originAddress: 'Rajiv Chowk, New Delhi',
            originLat: 28.6330,    // Near search origin (CP area)
            originLng: 77.2190,
            destinationPlaceId: 'ChIJQY0t70jhDDkR9MlHrQ1SuVo',
            destinationAddress: 'Greater Noida',
            destinationLat: 28.4746,   // Far from search destination
            destinationLng: 77.5040,
            departureDate,
            departureTime: '10:00',
            totalSeats: 3,
            availableSeats: 2,
            basePricePerSeat: 180,
            currency: 'INR',
            status: 'PUBLISHED',
            routeDistanceMeters: 60000,
            routeDurationSeconds: 5400,
            notes: 'Delhi → Greater Noida, passes through Sec 62 — test stopover dropoff',
            waypoints: {
                create: [
                    {
                        placeId: 'ChIJT4wYoGXhDDkRYjCGqpAdRao',
                        address: 'Sector 62, Noida (Stopover)',
                        lat: 28.6265,
                        lng: 77.3660,
                        waypointType: 'STOPOVER',
                        orderIndex: 1,
                        pricePerSeat: 140,
                    },
                ],
            },
        },
    });
    console.log('✅ Ride 3 (STOPOVER_DROPOFF):', ride3.id);

    // ─── RIDE 4: ALTERNATE_ROUTE ────────────────────────
    const ride4 = await prisma.ride.create({
        data: {
            driverId,
            originPlaceId: 'ChIJGZB8JaOaDTkRxuq_OOPX-sY',
            originAddress: 'Karol Bagh, New Delhi',
            originLat: 28.6520,    // Different origin (Karol Bagh)
            originLng: 77.1900,
            destinationPlaceId: 'ChIJfXBxDbvhDDkRnXJWxMBb_2k',
            destinationAddress: 'Sector 18, Noida',
            destinationLat: 28.5700,   // Different destination (Sec 18)
            destinationLng: 77.3220,
            departureDate,
            departureTime: '09:30',
            totalSeats: 4,
            availableSeats: 3,
            basePricePerSeat: 130,
            currency: 'INR',
            status: 'PUBLISHED',
            routeDistanceMeters: 30000,
            routeDurationSeconds: 3000,
            notes: 'Karol Bagh → Sec 18, stopovers near CP and Sec 62 — test alternate route',
            waypoints: {
                create: [
                    {
                        placeId: 'ChIJYSqbGhiYDDkRBxtlMR3t0I8',
                        address: 'Connaught Place Area (Stopover)',
                        lat: 28.6300,
                        lng: 77.2170,
                        waypointType: 'STOPOVER',
                        orderIndex: 1,
                        pricePerSeat: 100,
                    },
                    {
                        placeId: 'ChIJT4wYoGXhDDkRYjCGqpAdRao',
                        address: 'Near Sector 62 (Stopover)',
                        lat: 28.6260,
                        lng: 77.3640,
                        waypointType: 'STOPOVER',
                        orderIndex: 2,
                        pricePerSeat: 110,
                    },
                ],
            },
        },
    });
    console.log('✅ Ride 4 (ALTERNATE_ROUTE):', ride4.id);

    console.log('\n🎉 All 4 test rides seeded successfully!\n');
    console.log('📋 Test with:');
    console.log(`   curl "http://localhost:3000/api/v1/search-rides/advanced?originLat=28.6315&originLng=77.2167&destinationLat=28.6270&destinationLng=77.3650&departureDate=2026-02-15&radiusKm=5"`);

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
