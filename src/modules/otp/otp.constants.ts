export enum OtpPurpose {
  SIGNUP = 'signup',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password',
}

export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_LIMIT = 3;
export const OTP_RESEND_COOLDOWN_SEC = 60;
