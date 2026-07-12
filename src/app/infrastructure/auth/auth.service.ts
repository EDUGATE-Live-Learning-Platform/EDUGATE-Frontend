import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, switchMap, map, catchError } from 'rxjs/operators';
import { AuthPort } from '../../core/ports/auth.port';
import { LoginRequest } from '../../core/models/login-request.model';
import { LoginResponse } from '../../core/models/login-response.model';
import { ForgotPasswordRequest, VerifyOtpRequest, ResendOtpRequest } from '../../core/models/forgot-password-request.model';
import { ResetPasswordRequest } from '../../core/models/reset-password-request.model';
import { UserProfile } from '../../core/models/user-profile.model';
import { setCookie, getCookie, eraseCookie } from './cookie.utils';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends AuthPort {
  private http = inject(HttpClient);

  // Private signal for user state management
  private currentUserState = signal<UserProfile | null>(null);

  // Read-only public signal
  currentUser = computed(() => this.currentUserState());



  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', request).pipe(
      tap(res => {
        // Save AccessToken and RefreshToken securely in browser cookies
        setCookie('AccessToken', res.AccessToken, res.AccessTokenExpiresAt);
        setCookie('RefreshToken', res.RefreshToken);
      }),
      switchMap(res => this.getProfile().pipe(
        map(profile => {
          this.currentUserState.set(profile);
          return res;
        })
      )),
      catchError(err => this.handleError(err))
    );
  }

  refreshToken(refreshToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/refresh-token', { RefreshToken: refreshToken }).pipe(
      tap(res => {
        setCookie('AccessToken', res.AccessToken, res.AccessTokenExpiresAt);
        setCookie('RefreshToken', res.RefreshToken);
      }),
      catchError(err => {
        // If refresh fails, log out
        this.logout();
        return throwError(() => err);
      })
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ Message: string }> {
    return this.http.post<{ Message: string }>('/api/auth/forgot-password', request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  verifyOtp(request: VerifyOtpRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/verify-otp', request).pipe(
      tap(res => {
        // Save tokens so the reset-password endpoint can authorize
        setCookie('AccessToken', res.AccessToken, res.AccessTokenExpiresAt);
        setCookie('RefreshToken', res.RefreshToken);
      }),
      catchError(err => this.handleError(err))
    );
  }

  resendOtp(request: ResendOtpRequest): Observable<{ Message: string }> {
    return this.http.post<{ Message: string }>('/api/auth/resend-otp', request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ Message: string }> {
    return this.http.post<{ Message: string }>('/api/auth/reset-password', request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  registerStudent(formData: FormData): Observable<{ UserId: number; Message: string }> {
    return this.http.post<{ UserId: number; Message: string }>('/api/students/register', formData).pipe(
      catchError(err => this.handleError(err))
    );
  }

  private getAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendUrl = environment.apiUrl;
    return `${backendUrl}/${url.replace(/^\//, '')}`;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/api/users/profile').pipe(
      map(profile => {
        if (profile) {
          profile.ProfileImageUrl = this.getAbsoluteUrl(profile.ProfileImageUrl);
          if (profile.StudentIdImageUrl) {
            profile.StudentIdImageUrl = this.getAbsoluteUrl(profile.StudentIdImageUrl);
          }
        }
        return profile;
      }),
      tap(profile => this.currentUserState.set(profile)),
      catchError(err => this.handleError(err))
    );
  }

  updateProfile(request: Partial<UserProfile>): Observable<{ Message: string }> {
    return this.http.put<{ Message: string }>('/api/users/profile', request).pipe(
      tap(() => {
        // Optimistically update or re-fetch profile
        this.getProfile().subscribe();
      }),
      catchError(err => this.handleError(err))
    );
  }

  uploadProfileImage(imageFile: File): Observable<{ ProfileImageUrl: string; Message: string }> {
    const formData = new FormData();
    formData.append('Image', imageFile);
    
    return this.http.put<{ ProfileImageUrl: string; Message: string }>('/api/users/profile/image', formData).pipe(
      map(res => {
        return {
          ...res,
          ProfileImageUrl: this.getAbsoluteUrl(res.ProfileImageUrl) || ''
        };
      }),
      tap(res => {
        // Update local user state image
        this.currentUserState.update(user => {
          if (!user) return null;
          return { ...user, ProfileImageUrl: res.ProfileImageUrl };
        });
      }),
      catchError(err => this.handleError(err))
    );
  }

  logout(): void {
    eraseCookie('AccessToken');
    eraseCookie('RefreshToken');
    this.currentUserState.set(null);
  }

  /**
   * Helper to inspect validation errors from FluentValidation schema (400 Bad Request)
   */
  extractValidationErrors(error: HttpErrorResponse | unknown): Record<string, string[]> {
    if (error instanceof HttpErrorResponse && error.status === 400 && error.error?.errors) {
      return error.error.errors;
    }
    return {};
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // Forward the error to components for custom handling
    return throwError(() => error);
  }
}
