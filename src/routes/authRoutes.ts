import express from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/authMiddleware';
import * as schemas from '../utils/validationSchemas';

const router = express.Router();

router.post('/signup', validate({ body: schemas.signupSchema }), authController.signup);
router.post(
  '/otp/request',
  validate({ body: schemas.otpRequestSchema }),
  authController.requestOtp,
);
router.post('/otp/resend', validate({ body: schemas.otpRequestSchema }), authController.resendOtp);
router.post('/otp/verify', validate({ body: schemas.otpVerifySchema }), authController.verifyOtp);
router.post('/login', validate({ body: schemas.loginSchema }), authController.login);
router.post(
  '/refresh',
  validate({ body: schemas.refreshTokenSchema }),
  authController.refreshToken,
);
router.post('/logout', authController.logout);

export default router;
