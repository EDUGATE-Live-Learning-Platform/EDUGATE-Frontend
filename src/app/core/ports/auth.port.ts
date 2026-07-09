import { Observable } from 'rxjs';
import { Signal } from '@angular/core';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { ForgotPasswordRequest, VerifyOtpRequest, ResendOtpRequest } from '../models/forgot-password-request.model';
import { ResetPasswordRequest } from '../models/reset-password-request.model';
import { UserProfile } from '../models/user-profile.model';

export abstract class AuthPort {
  /**
   * Reactive signal to track logged in user details globally.
   */
  abstract currentUser: Signal<UserProfile | null>;

  /**
   * Authenticates the user and sets access/refresh tokens.
   */
  abstract login(request: LoginRequest): Observable<LoginResponse>;

  /**
   * Refreshes the active access token using the refresh token.
   */
  abstract refreshToken(refreshToken: string): Observable<LoginResponse>;

  /**
   * Initiates password recovery process.
   */
  abstract forgotPassword(request: ForgotPasswordRequest): Observable<{ Message: string }>;

  /**
   * Verifies the 6-digit confirmation security code.
   */
  abstract verifyOtp(request: VerifyOtpRequest): Observable<LoginResponse>;

  /**
   * Resends the 6-digit confirmation security code.
   */
  abstract resendOtp(request: ResendOtpRequest): Observable<{ Message: string }>;

  /**
   * Submits the updated password.
   */
  abstract resetPassword(request: ResetPasswordRequest): Observable<{ Message: string }>;

  /**
   * Submits student registration including identity card attachment.
   */
  abstract registerStudent(formData: FormData): Observable<{ UserId: number; Message: string }>;

  /**
   * Retrieves active authenticated user details.
   */
  abstract getProfile(): Observable<UserProfile>;

  /**
   * Updates user details in profile record.
   */
  abstract updateProfile(request: Partial<UserProfile>): Observable<{ Message: string }>;

  /**
   * Uploads raw binary avatar image file.
   */
  abstract uploadProfileImage(imageFile: File): Observable<{ ProfileImageUrl: string; Message: string }>;

  /**
   * Logs out the user and clears secure cookies.
   */
  abstract logout(): void;
}
