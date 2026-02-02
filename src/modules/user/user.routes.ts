import express from 'express';
import * as userController from './user.controller.js';
import { validate } from '../../middlewares/index.js';
import { uploadSingleImage } from '../../middlewares/upload.middleware.js';
import * as schemas from './user.validators.js';

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
router.post(
  '/me/avatar',
  uploadSingleImage,
  validate({ file: schemas.avatarUploadSchema }),
  userController.uploadAvatar as unknown as express.RequestHandler,
);

export default router;
