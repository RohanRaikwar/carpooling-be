import express from 'express';
import * as userController from '../controllers/userController.js';

import { validate } from '../middlewares/validate.js';
import * as schemas from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/me', userController.getMe as unknown as express.RequestHandler);
router.put(
  '/me/profile',
  validate({ body: schemas.updateProfileSchema }),
  userController.updateProfile as unknown as express.RequestHandler,
);
router.post(
  '/me/onboarding/complete',
  validate({ body: schemas.updateProfileSchemaOnBoarding }),
  userController.completeOnBoardingStep1 as unknown as express.RequestHandler,
);

export default router;
