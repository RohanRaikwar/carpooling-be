import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './search-ride.controller.js';
import {
    searchRideQuerySchema,
    rideIdParamSchema,
    notifyRideSchema,
    recentSearchesQuerySchema,
    enhancedSearchRideQuerySchema,
} from './search-ride.validator.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = Router();

// Advanced search rides - Public endpoint with three-condition matching
router.get(
    '/advanced',
    validate({ query: enhancedSearchRideQuerySchema }),
    controller.searchRidesAdvanced
);

// Search rides - Public endpoint (no auth required for browsing)
router.get(
    '/',
    validate({ query: searchRideQuerySchema }),
    controller.searchRides
);

// Get recent searches - Protected endpoint
router.get(
    '/user/recent',
    protect,
    validate({ query: recentSearchesQuerySchema }),
    controller.getRecentSearches
);

// Get ride details - Public endpoint
router.get(
    '/:id',
    validate({ params: rideIdParamSchema }),
    controller.getRideDetails
);

// Create ride alert (notify when ride available) - Protected endpoint
router.post(
    '/notify',
    protect,
    validate({ body: notifyRideSchema }),
    controller.createRideAlert
);

export default router;

