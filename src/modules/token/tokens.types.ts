export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface DecodedToken {
  id: string;
  role: string;
}
