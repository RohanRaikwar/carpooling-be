import { Request, Response } from 'express';
import { sendSuccess, sendError, HttpStatus } from '@utils';
import {
  signupService,
  verifyOtpService,
  refreshTokenService,
  logoutService,
  loginService,
  requestOtpService,
} from './auth.service';
import { sendMail } from '../mail/mail.service';
import {
  signupOtpTemplate,
  loginOtpTemplate,
  resetOtpTemplate,
  signupWelcomeTemplate,
} from '../mail/mail.templates';
import { createOtp, verifyOtp, resendOtp } from '../otp/otp.service';

export const signup = async (req: Request, res: Response) => {
  try {
    const { method, email, phone } = req.body;
    const identifier = method === 'email' ? email : phone;

    const result = await signupService(method, identifier);
    if (result.success === false) {
      return sendError(res, {
        message: result.reason || 'Failed to create user',
        status: HttpStatus.CONFLICT,
      });
    }

    const { code, success, reason } = await createOtp(identifier, 'signup', method);

    if (success === false || code === undefined || code === null) {
      return sendError(res, {
        message: reason || 'Failed to generate OTP',
        status: HttpStatus.INTERNAL_ERROR,
      });
    }

    await sendMail({
      to: identifier,
      subject: 'Signup OTP',
      html: signupOtpTemplate(code),
    });

    return sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Signup successful, verify OTP',
      data: { next: 'verify_otp' },
    });
  } catch (err: any) {
    if (err.message === 'USER_EXISTS') {
      return sendError(res, {
        status: HttpStatus.CONFLICT,
        message: 'User already exists',
      });
    }

    return sendError(res, { message: err.message || 'Server error' });
  }
};
export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { method, identifier, purpose } = req.body;

    const { user, success } = await requestOtpService(identifier, purpose, method);
    if (!success) {
      return sendError(res, {
        status: HttpStatus.CONFLICT,
        message: 'User already exists',
      });
    }
    const otp = await createOtp(identifier, purpose, method);

    if (otp.success === false || otp.code === undefined || otp.code === null) {
      return sendError(res, { message: otp.reason || 'Failed to generate OTP' });
    }

    const code = otp.code;

    if (method === 'email') {
      await sendMail({
        to: identifier,
        subject: 'Your OTP',
        html: resetOtpTemplate(code),
      });
    }

    return sendSuccess(res, {
      message: 'OTP sent successfully',
      data: { next: 'verify_otp' },
    });
  } catch (err) {
    console.error('Request OTP error:', err);
    return sendError(res, { message: 'Server error' });
  }
};
export const verifyOtpCont = async (req: Request, res: Response) => {
  try {
    const { identifier, code, purpose, method } = req.body;
    const verifyResult = await verifyOtp(identifier, purpose, code, method);

    if (!verifyResult.success) {
      let errorMessage: string;
      if (verifyResult.reason === 'expired') {
        errorMessage = 'OTP expired';
      } else if (verifyResult.reason === 'too_many_attempts') {
        errorMessage = 'Too many wrong attempts';
      } else {
        errorMessage = 'Invalid OTP';
      }
      return sendError(res, {
        status: HttpStatus.BAD_REQUEST,
        message: errorMessage,
      });
    }
    console.log(verifyResult, 'ufgu');
    const result = await verifyOtpService(identifier, code, purpose, method);
    console.log(result, 'ufgu');
    if ('success' in result && !result.success) {
      return sendError(res, {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired OTP',
      });
    }

    if ('tokens' in result && result.user && result.success) {
      return sendSuccess(res, {
        message: 'Verification successful',
        data: {
          ...result.tokens,
          user: {
            id: result.user.uuid,
            email: result.user.email,
            role: 'USER',
          },
          next: result.next,
        },
      });
    }

    return sendError(res, { message: 'Server error' });
  } catch {
    return sendError(res, { message: 'Server error' });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { method, identifier } = req.body;
    if (method !== 'email' && method !== 'phone') {
      return res.status(400).json({ message: 'Invalid login request' });
    }

    const { user } = await loginService(method, identifier);
    if (!user) {
      return sendError(res, {
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }
    if (!user.isVerified) {
      return sendError(res, {
        status: HttpStatus.FORBIDDEN,
        message: 'User not verified',
      });
    }
    const otp = await createOtp(identifier, 'login', method);

    if (otp.success === false || otp.code === undefined || otp.code === null) {
      return sendError(res, { message: otp.reason || 'Failed to generate OTP' });
    }

    const code = otp.code;

    if (method === 'email') {
      await sendMail({
        to: identifier,
        subject: 'Login OTP',
        html: signupOtpTemplate(code),
      });

      return sendSuccess(res, {
        message: 'OTP sent for login',
        data: { next: 'verify_otp' },
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, { message: 'Server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const tokens = await refreshTokenService(req.body.refreshToken);
    if (!tokens.success) {
      return sendError(res, {
        status: HttpStatus.UNAUTHORIZED,
        message: tokens.reason || 'Invalid refresh token',
      });
    }
    return sendSuccess(res, { data: tokens.tokens });
  } catch (err) {
    console.error('Refresh token error:', err);
    return sendError(res, {
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid refresh token',
    });
  }
};

export const resendOtpCont = async (req: Request, res: Response) => {
  try {
    const { identifier, purpose, method } = req.body;
    const resendOtpResult = await resendOtp(identifier, purpose, method);
    if (!resendOtpResult.success) {
      let errorMessage: string;
      if (resendOtpResult.reason === 'cooldown') {
        errorMessage = 'Please wait before requesting another OTP';
      } else {
        errorMessage = 'Unable to resend OTP';
      }
      return sendError(res, {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: errorMessage,
      });
    }

    const result = resendOtpResult;
    if (method === 'email') {
      await sendMail({
        to: identifier,
        subject: 'Resend OTP',
        html: purpose === 'signup' ? signupOtpTemplate(result.otp) : loginOtpTemplate(result.otp),
      });
    }

    return sendSuccess(res, {
      message: result.reused ? 'OTP resent' : 'New OTP generated',
      status: HttpStatus.OK,
    });
  } catch {
    return sendError(res, { message: 'Server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await logoutService(refreshToken);
  if (!result.success) {
    return sendError(res, {
      status: HttpStatus.BAD_REQUEST,
      message: `Invalid refresh token: ${result.reason}`,
    });
  }
  return sendSuccess(res, { message: 'Logged out successfully' });
};
