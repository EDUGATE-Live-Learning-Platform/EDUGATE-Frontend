export interface ForgotPasswordRequest {
  Email: string;
}

export interface VerifyOtpRequest {
  Email: string;
  OtpCode: string;
}

export interface ResendOtpRequest {
  Email: string;
}
