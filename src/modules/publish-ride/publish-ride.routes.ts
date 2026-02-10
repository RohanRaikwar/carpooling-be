import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './publish-ride.controller.js';
import {
    createOriginSchema,
    updateDestinationSchema,
    updateScheduleSchema,
    updateCapacitySchema,
    updatePricingSchema,
    updateNotesSchema,
    listRidesQuerySchema,
    rideIdParamSchema,
    updateStopoversSchema,
    selectRouteSchema,
    listDraftsQuerySchema,
} from './publish-ride.validator.js';

const router = Router();

/* ============================================================
   PUBLISH RIDE WIZARD — All draft steps use Redis
   Flow: Origin → Destination → Compute Routes → Select Route
         → Get Stopper Suggestions → Set Stoppers → Schedule
         → Capacity → Get Price Recommendation → Set Pricing
         → Notes → Publish
   ============================================================ */

// Step 1: Create draft with origin
router.post(
    '/origin',
    validate({ body: createOriginSchema }),
    controller.createWithOrigin
);

// Step 2: Set destination
router.put(
    '/:id/destination',
    validate({ params: rideIdParamSchema, body: updateDestinationSchema }),
    controller.updateDestination
);

// Step 3: Compute route options (find paths)
router.get(
    '/:id/routes/compute',
    validate({ params: rideIdParamSchema }),
    controller.computeRoutes
);

// Step 4: Select route (set path)
router.put(
    '/:id/routes/select',
    validate({ params: rideIdParamSchema, body: selectRouteSchema }),
    controller.selectRoute
);

// Step 5: Get stopper point suggestions (famous cities/places along the route)
router.get(
    '/:id/stopovers/suggestions',
    validate({ params: rideIdParamSchema }),
    controller.getStopoverSuggestions
);

// Step 6: Set stopper points
router.put(
    '/:id/stopovers',
    validate({ params: rideIdParamSchema, body: updateStopoversSchema }),
    controller.updateStopovers
);

// Step 7: Set schedule (date/time)
router.put(
    '/:id/schedule',
    validate({ params: rideIdParamSchema, body: updateScheduleSchema }),
    controller.updateSchedule
);

// Step 8: Set capacity (seats)
router.put(
    '/:id/capacity',
    validate({ params: rideIdParamSchema, body: updateCapacitySchema }),
    controller.updateCapacity
);

// Step 9: Get recommended price (with stopper point pricing)
router.get(
    '/:id/pricing/recommended',
    validate({ params: rideIdParamSchema }),
    controller.getRecommendedPrice
);

// Step 10: Set pricing
router.put(
    '/:id/pricing',
    validate({ params: rideIdParamSchema, body: updatePricingSchema }),
    controller.updatePricing
);

// Step 11: Update notes
router.patch(
    '/:id/notes',
    validate({ params: rideIdParamSchema, body: updateNotesSchema }),
    controller.updateNotes
);

// Step 12: Publish ride — Redis → DB
router.post(
    '/:id/publish',
    validate({ params: rideIdParamSchema }),
    controller.publishRide
);

/* ============================================================
   DRAFT MANAGEMENT (Redis)
   ============================================================ */

// List user's drafts
router.get(
    '/drafts',
    validate({ query: listDraftsQuerySchema }),
    controller.listDrafts
);

// Get a single draft by ID
router.get(
    '/drafts/:id',
    validate({ params: rideIdParamSchema }),
    controller.getDraftById
);

// Delete a draft
router.delete(
    '/drafts/:id',
    validate({ params: rideIdParamSchema }),
    controller.deleteDraft
);

/* ============================================================
   PUBLISHED RIDE OPERATIONS (DB)
   ============================================================ */

// List user's published rides with pagination
router.get(
    '/',
    validate({ query: listRidesQuerySchema }),
    controller.getUserRides
);

// Get single published ride by ID
router.get(
    '/:id',
    validate({ params: rideIdParamSchema }),
    controller.getRideById
);

// Cancel ride
router.delete(
    '/:id',
    validate({ params: rideIdParamSchema }),
    controller.cancelRide
);

export default router;
