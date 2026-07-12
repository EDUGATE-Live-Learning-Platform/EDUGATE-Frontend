import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './infrastructure/auth/auth.interceptor';
import { TranslationService } from './core/services/translation.service';
import { AuthService } from './infrastructure/auth/auth.service';
import { getCookie } from './infrastructure/auth/cookie.utils';

export function initializeTranslations(translationService: TranslationService): () => Promise<void> {
  return () => translationService.loadTranslations();
}

export function initializeAuth(authService: AuthService): () => Promise<void> {
  return () => new Promise<void>((resolve) => {
    const token = getCookie('AccessToken') || getCookie('RefreshToken');
    if (token) {
      authService.getProfile().subscribe({
        next: () => resolve(),
        error: () => {
          authService.logout();
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslationService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    }
  ],
};
