import { RequestHandler, Router } from 'express';
import { saveTravelPreference, getTravelPreference } from './travelPreference.controller';
import { validate } from '../../middlewares/validate.js';
import { travelPreferenceSchema } from './travelPreference.validator';
import { asyncHandler } from '../../utils/index';
import { AuthRequest } from '../../types/auth';

const router = Router();

router.put('/', validate({ body: travelPreferenceSchema }), saveTravelPreference as RequestHandler);

router.get('/', asyncHandler<AuthRequest>(getTravelPreference));

export default router;
