import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  router = inject(Router);
  languageService = inject(LanguageService);
  translationService = inject(TranslationService);

  // Layout Language state
  lang = this.languageService.currentLang;
  t = this.translationService.translations;

  // Active step flow: 1 = Submit Email, 2 = Verify OTP, 3 = Reset Password
  step = signal<1 | 2 | 3>(1);

  // Form fields signals
  email = signal<string>('');
  otp = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');

  // UI state signals
  isSubmitting = signal<boolean>(false);
  validationErrors = signal<Record<string, string[]>>({});
  generalError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  sendOtp(): void {
    if (!this.email().trim()) return;

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.successMessage.set(null);
    this.validationErrors.set({});

    this.authService.forgotPassword({ Email: this.email() }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(res.Message);
        this.step.set(2);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errors = this.authService.extractValidationErrors(err);
        if (Object.keys(errors).length > 0) {
          this.validationErrors.set(errors);
        } else {
          this.generalError.set(this.translationService.translate('forgotPassword.initiateError'));
        }
      }
    });
  }

  resendOtp(): void {
    if (!this.email().trim()) return;

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.successMessage.set(null);

    this.authService.resendOtp({ Email: this.email() }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(this.translationService.translate('forgotPassword.resendSuccess'));
      },
      error: () => {
        this.isSubmitting.set(false);
        this.generalError.set(this.translationService.translate('forgotPassword.resendError'));
      }
    });
  }

  verifyOtp(): void {
    if (!this.otp().trim()) return;

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.successMessage.set(null);
    this.validationErrors.set({});

    this.authService.verifyOtp({ Email: this.email(), OtpCode: this.otp() }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(this.translationService.translate('forgotPassword.verifySuccess'));
        this.step.set(3);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errors = this.authService.extractValidationErrors(err);
        if (Object.keys(errors).length > 0) {
          this.validationErrors.set(errors);
        } else {
          this.generalError.set(this.translationService.translate('forgotPassword.verifyError'));
        }
      }
    });
  }

  resetPassword(): void {
    if (!this.newPassword().trim() || !this.confirmPassword().trim()) return;

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.successMessage.set(null);
    this.validationErrors.set({});

    this.authService.resetPassword({
      NewPassword: this.newPassword(),
      ConfirmPassword: this.confirmPassword()
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(this.translationService.translate('forgotPassword.resetSuccess'));
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errors = this.authService.extractValidationErrors(err);
        if (Object.keys(errors).length > 0) {
          this.validationErrors.set(errors);
        } else {
          this.generalError.set(this.translationService.translate('forgotPassword.resetError'));
        }
      }
    });
  }
}
