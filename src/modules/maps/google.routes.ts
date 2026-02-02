import { Router } from 'express';
import { googleController } from './google.controller.js';
import { validate } from '../../middlewares/validate.js';
import {
  computeRouteSchema,
  multiRouteSchema,
  geolocationSchema,
  snapRoadsSchema,
  autocompleteSchema,
  placeDetailsSchema,
} from './google.validator.js';

const router = Router();

router.post('/routes/compute', validate({ body: computeRouteSchema }), googleController.routes);
router.post('/routes/multi', validate({ body: multiRouteSchema }), googleController.multiRoute);
router.post('/roads/snap', validate({ body: snapRoadsSchema }), googleController.roads);
router.post('/geolocation', validate({ body: geolocationSchema }), googleController.geolocation);
router.get(
  '/place/autocomplete',
  validate({ query: autocompleteSchema }),
  googleController.autocomplete,
);
router.get(
  '/place/place-details',
  validate({ query: placeDetailsSchema }),
  googleController.placeDetails,
);

export default router;
