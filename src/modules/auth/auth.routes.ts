import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate';
import * as schemas from './auth.validator';

const router = express.Router();

router.post('/signup', validate({ body: schemas.signupSchema }), authController.signup);
router.post(
  '/otp/request',
  validate({ body: schemas.otpRequestSchema }),
  authController.requestOtp,
);
router.post(
  '/otp/resend',
  validate({ body: schemas.otpRequestSchema }),
  authController.resendOtpCont,
);
router.post(
  '/otp/verify',
  validate({ body: schemas.otpVerifySchema }),
  authController.verifyOtpCont,
);
router.post('/login', validate({ body: schemas.loginSchema }), authController.login);
router.post(
  '/access-token',
  validate({ body: schemas.refreshTokenSchema }),
  authController.refreshToken,
);
router.post('/logout', validate({ body: schemas.refreshTokenSchema }), authController.logout);

export default router;
