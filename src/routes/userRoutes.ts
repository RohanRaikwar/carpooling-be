import express from 'express';
import * as userController from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import * as schemas from '../utils/validationSchemas';

const router = express.Router();

router.get('/me', userController.getMe as unknown as express.RequestHandler);
router.put(
  '/me/profile',
  protect,
  validate(schemas.updateProfileSchema),
  userController.updateProfile as unknown as express.RequestHandler,
);
router.post(
  '/me/profile/onboarding/1',
  validate(schemas.updateProfileSchemaOnBoarding),
  userController.completeOnBoardingStep1 as unknown as express.RequestHandler,
);

export default router;
