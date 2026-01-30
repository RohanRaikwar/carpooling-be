import express from 'express';
import * as userController from '../controllers/userController';

import { validate } from '../middlewares/validate';
import * as schemas from '../utils/validationSchemas';

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
