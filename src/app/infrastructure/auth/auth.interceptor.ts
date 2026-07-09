import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { getCookie } from './cookie.utils';
import { AuthService } from './auth.service';
import { catchError, switchMap, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface ApiResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors?: Record<string, string[]>;
}

import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = getCookie('AccessToken');

  const baseUrl = environment.apiUrl;
  let targetUrl = req.url;

  // Prepend backend host to relative API endpoints
  if (req.url.startsWith('/api')) {
    targetUrl = `${baseUrl}${req.url}`;
  }

  let authReq = req.clone({
    url: targetUrl
  });

  // Append Bearer token if it exists in cookies
  if (token) {
    authReq = req.clone({
      url: targetUrl,
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        const body = event.body as ApiResponse | null;
        // Check if the response body follows our standardized ApiResponse shape
        if (body && typeof body === 'object' && 'success' in body) {
          if (body.success) {
            let mappedData = body.data;
            
            // If data is null/undefined but there is a message, fallback to mapping it
            if (mappedData === null || mappedData === undefined) {
              mappedData = { Message: body.message, message: body.message };
            } else if (typeof mappedData === 'object') {
              if (Array.isArray(mappedData)) {
                mappedData = mappedData.map(item => {
                  if (item && typeof item === 'object') {
                    const rawItem = item as Record<string, unknown>;
                    const standardizedItem: Record<string, unknown> = { ...rawItem };
                    for (const key of Object.keys(rawItem)) {
                      const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
                      if (!(capitalized in standardizedItem)) {
                        standardizedItem[capitalized] = rawItem[key];
                      }
                      const lowercased = key.charAt(0).toLowerCase() + key.slice(1);
                      if (!(lowercased in standardizedItem)) {
                        standardizedItem[lowercased] = rawItem[key];
                      }
                    }
                    return standardizedItem;
                  }
                  return item;
                });
              } else {
                const rawData = mappedData as Record<string, unknown>;
                const standardized: Record<string, unknown> = { ...rawData };
                for (const key of Object.keys(rawData)) {
                  const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
                  if (!(capitalized in standardized)) {
                    standardized[capitalized] = rawData[key];
                  }
                  const lowercased = key.charAt(0).toLowerCase() + key.slice(1);
                  if (!(lowercased in standardized)) {
                    standardized[lowercased] = rawData[key];
                  }
                }
                
                if (body.message) {
                  standardized['Message'] = body.message;
                  standardized['message'] = body.message;
                }
                mappedData = standardized;
              }
            }
            
            return event.clone({ body: mappedData });
          } else {
            // Throw custom error matching standard response structures
            throw new HttpErrorResponse({
              error: { errors: body.errors, message: body.message, Error: body.message },
              status: body.errors ? 422 : 400,
              statusText: body.message,
              url: req.url
            });
          }
        }
      }
      return event;
    }),
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        // Intercept 401 Unauthorized errors (excluding login/refresh requests themselves)
        if (
          error.status === 401 &&
          !req.url.includes('/api/auth/login') &&
          !req.url.includes('/api/auth/refresh-token')
        ) {
          const refreshToken = getCookie('RefreshToken');
          if (refreshToken) {
            return authService.refreshToken(refreshToken).pipe(
              switchMap(res => {
                // Clone original request with targetUrl and new access token
                const retryReq = req.clone({
                  url: targetUrl,
                  setHeaders: {
                    Authorization: `Bearer ${res.AccessToken}`
                  }
                });
                return next(retryReq);
              }),
              catchError(refreshErr => {
                // Rotation failed, logout user
                authService.logout();
                return throwError(() => refreshErr);
              })
            );
          }
        }
      }
      return throwError(() => error);
    })
  );
};
