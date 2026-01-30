export interface ApiSuccess<T> {
  success: true;
  data: T;
  statusCode: number;
}

export interface ApiFailure {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
