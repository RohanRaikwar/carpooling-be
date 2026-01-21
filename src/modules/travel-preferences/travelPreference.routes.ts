import { Router } from 'express';
import { saveTravelPreference, getTravelPreference } from './travelPreference.controller';

import { validate } from '../../middleware/validate';
import { travelPreferenceSchema } from './travelPreference.validator';

const router = Router();

router.put('/', validate({ body: travelPreferenceSchema }), saveTravelPreference);

router.get('/', getTravelPreference);

export default router;
