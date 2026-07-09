import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  authService = inject(AuthService);
  languageService = inject(LanguageService);
  translationService = inject(TranslationService);

  // Layout Language state
  lang = this.languageService.currentLang;
  t = this.translationService.translations;

  // Multi-step form state: 1 = Personal Details, 2 = Academic & Verification
  step = signal<1 | 2>(1);

  // Form Fields signals
  fullName = signal<string>('');
  email = signal<string>('');
  mobileNumber = signal<string>('');
  parentPhoneNumber = signal<string>('');
  governorate = signal<string>('');
  schoolName = signal<string>('');
  academicGrade = signal<'FirstGrade' | 'SecondGrade' | 'ThirdGrade' | ''>('');
  academicDivision = signal<'General' | 'Scientific' | 'Literary' | ''>('');
  password = signal<string>('');
  confirmPassword = signal<string>('');
  termsAccepted = signal<boolean>(false);
  
  // File Attachment signal
  selectedFile = signal<File | null>(null);

  // Password visibility signals
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);

  togglePasswordVisibility(): void {
    this.showPassword.update(s => !s);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(s => !s);
  }

  // Form state signals
  isSubmitting = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  validationErrors = signal<Record<string, string[]>>({});
  generalError = signal<string | null>(null);
  fileError = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Limit file size to 2MB and check types (JPG/PNG only)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(file.type)) {
        this.fileError.set(this.translationService.translate('register.fileTypeError'));
        this.selectedFile.set(null);
        return;
      }

      if (file.size > maxSize) {
        this.fileError.set(this.translationService.translate('register.fileSizeError'));
        this.selectedFile.set(null);
        return;
      }

      this.fileError.set(null);
      this.selectedFile.set(file);
    }
  }

  goToNextStep(): void {
    // Clear previous errors
    this.generalError.set(null);
    this.validationErrors.set({});

    // Basic client-side checks for Step 1
    if (!this.fullName().trim() || !this.email().trim() || !this.mobileNumber().trim() || !this.password().trim()) {
      this.generalError.set(this.translationService.translate('register.fillAllError'));
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.generalError.set(this.translationService.translate('register.passwordsMismatchError'));
      return;
    }

    this.step.set(2);
  }

  goToPrevStep(): void {
    this.generalError.set(null);
    this.step.set(1);
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.generalError.set(null);
    this.successMessage.set(null);
    this.validationErrors.set({});

    // Validate that the StudentIdImage file is selected
    if (!this.selectedFile()) {
      this.fileError.set(this.translationService.translate('register.fileRequiredError'));
      return;
    }

    this.isSubmitting.set(true);

    // Build standard multipart/form-data
    const formData = new FormData();
    formData.append('FullName', this.fullName());
    formData.append('Email', this.email());
    formData.append('MobileNumber', this.mobileNumber());
    formData.append('ParentPhoneNumber', this.parentPhoneNumber());
    formData.append('Governorate', this.governorate());
    formData.append('SchoolName', this.schoolName());
    formData.append('AcademicGrade', this.academicGrade());
    formData.append('AcademicDivision', this.academicDivision());
    formData.append('Password', this.password());
    formData.append('PasswordConfirmation', this.confirmPassword());
    formData.append('TermsAccepted', String(this.termsAccepted()));
    formData.append('StudentIdImage', this.selectedFile() as File);

    this.authService.registerStudent(formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(res.Message);
        
        // Reset form and go back to step 1
        this.fullName.set('');
        this.email.set('');
        this.mobileNumber.set('');
        this.parentPhoneNumber.set('');
        this.governorate.set('');
        this.schoolName.set('');
        this.academicGrade.set('');
        this.academicDivision.set('');
        this.password.set('');
        this.confirmPassword.set('');
        this.termsAccepted.set(false);
        this.selectedFile.set(null);
        this.step.set(1);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errors = this.authService.extractValidationErrors(err);
        if (Object.keys(errors).length > 0) {
          this.validationErrors.set(errors);
          
          // If the errors belong to Step 1 fields, go back to step 1 automatically
          const step1Fields = ['FullName', 'Email', 'MobileNumber', 'ParentPhoneNumber', 'Password', 'PasswordConfirmation'];
          const hasStep1Error = Object.keys(errors).some(key => step1Fields.includes(key));
          if (hasStep1Error) {
            this.step.set(1);
          }
        } else {
          this.generalError.set(this.translationService.translate('register.serverError'));
        }
      }
    });
  }
}
