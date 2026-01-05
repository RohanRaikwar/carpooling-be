import express from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/authMiddleware';
import * as schemas from '../utils/validationSchemas';

const router = express.Router();

router.post('/signup', validate(schemas.signupSchema), authController.signup);
router.post('/otp/request', validate(schemas.otpRequestSchema), authController.requestOtp);
router.post('/otp/resend', validate(schemas.otpRequestSchema), authController.resendOtp);
router.post('/otp/verify', validate(schemas.otpVerifySchema), authController.verifyOtp);
router.post('/login', validate(schemas.loginSchema), authController.login);
router.post('/refresh', validate(schemas.refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
