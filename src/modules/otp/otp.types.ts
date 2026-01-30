export interface VerifyOtpResult {
  success: boolean;
  reason?: 'invalid_otp' | 'expired' | 'too_many_attempts';
}

export interface ResendOtpResult {
  success: boolean;
  otp?: string;
  reused?: boolean;
  reason?: 'cooldown' | 'limit_reached';
}
