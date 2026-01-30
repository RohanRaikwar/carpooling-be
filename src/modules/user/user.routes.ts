import express from 'express';
import * as userController from './user.controller';
import { validate } from '@middlewares';
import * as schemas from './user.validators';

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
