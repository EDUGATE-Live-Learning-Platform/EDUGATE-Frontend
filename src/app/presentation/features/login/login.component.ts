import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LoginRequest } from '../../../core/models/login-request.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  languageService = inject(LanguageService);
  translationService = inject(TranslationService);

  // Expose language state
  lang = this.languageService.currentLang;
  t = this.translationService.translations;

  // Signal state for inputs
  email = signal<string>('');
  password = signal<string>('');
  rememberMe = signal<boolean>(false);

  // UI state signals
  isSubmitting = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  
  // Validation and general errors from FluentValidation
  validationErrors = signal<Record<string, string[]>>({});
  generalError = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.validationErrors.set({});

    const payload: LoginRequest = {
      Email: this.email(),
      Password: this.password(),
      RememberMe: this.rememberMe()
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const user = this.authService.currentUser();
        if (user && user.Role === 'Admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        
        // Extract validation errors if it was a 400/422 Bad Request
        const errors = this.authService.extractValidationErrors(err);
        if (Object.keys(errors).length > 0) {
          this.validationErrors.set(errors);
        } else if (err.status === 401) {
          this.generalError.set(this.translationService.translate('login.unauthorizedError'));
        } else {
          // If the server returned a specific error message, show it. Otherwise show default.
          const serverMessage = err.error?.message || err.error?.Message;
          if (serverMessage) {
            this.generalError.set(serverMessage);
          } else {
            this.generalError.set(this.translationService.translate('login.serverError'));
          }
        }
      }
    });
  }
}
