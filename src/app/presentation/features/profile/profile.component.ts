import { Component, ChangeDetectionStrategy, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);

  // Layout Language state
  lang = this.layout.currentLang;
  t = this.translationService.translations;

  // Editing state signals
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isUploadingImage = signal<boolean>(false);

  // Editing fields signals
  fullName = signal<string>('');
  mobileNumber = signal<string>('');
  parentPhoneNumber = signal<string>('');
  governorate = signal<string>('');
  schoolName = signal<string>('');
  academicGrade = signal<'FirstGrade' | 'SecondGrade' | 'ThirdGrade' | ''>('');
  academicDivision = signal<'General' | 'Scientific' | 'Literary' | ''>('');

  // UI state alerts
  successMessage = signal<string | null>(null);
  generalError = signal<string | null>(null);
  validationErrors = signal<Record<string, string[]>>({});
  imageUploadError = signal<string | null>(null);

  constructor() {
    // Keep local form bindings in sync with reactive currentUser state changes
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.fullName.set(user.FullName || '');
        this.mobileNumber.set(user.MobileNumber || '');
        this.parentPhoneNumber.set(user.ParentPhoneNumber || '');
        this.governorate.set(user.Governorate || '');
        this.schoolName.set(user.SchoolName || '');
        this.academicGrade.set(user.AcademicGrade || '');
        this.academicDivision.set(user.AcademicDivision || '');
      }
    });
  }

  ngOnInit(): void {
    // Refresh user profile details from backend upon component creation
    this.authService.getProfile().subscribe({
      error: () => {
        // If unauthenticated or token refresh failed, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }

  startEdit(): void {
    this.isEditing.set(true);
    this.successMessage.set(null);
    this.generalError.set(null);
    this.validationErrors.set({});
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    
    // Restore from cached Signal state
    const user = this.authService.currentUser();
    if (user) {
      this.fullName.set(user.FullName || '');
      this.mobileNumber.set(user.MobileNumber || '');
      this.parentPhoneNumber.set(user.ParentPhoneNumber || '');
      this.governorate.set(user.Governorate || '');
      this.schoolName.set(user.SchoolName || '');
      this.academicGrade.set(user.AcademicGrade || '');
      this.academicDivision.set(user.AcademicDivision || '');
    }
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(file.type)) {
        this.imageUploadError.set(this.translationService.translate('profile.fileTypeError'));
        return;
      }

      if (file.size > maxSize) {
        this.imageUploadError.set(this.translationService.translate('profile.fileSizeError'));
        return;
      }

      this.imageUploadError.set(null);
      this.isUploadingImage.set(true);

      this.authService.uploadProfileImage(file).subscribe({
        next: () => {
          this.isUploadingImage.set(false);
          this.successMessage.set(this.translationService.translate('profile.uploadSuccess'));
        },
        error: () => {
          this.isUploadingImage.set(false);
          this.generalError.set(this.translationService.translate('profile.uploadError'));
        }
      });
    }
  }

  saveProfile(): void {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.generalError.set(null);
    this.validationErrors.set({});

    const payload = {
      FullName: this.fullName(),
      MobileNumber: this.mobileNumber(),
      ParentPhoneNumber: this.parentPhoneNumber(),
      Governorate: this.governorate(),
      SchoolName: this.schoolName(),
      AcademicGrade: this.academicGrade() || undefined,
      AcademicDivision: this.academicDivision() || undefined
    };

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.successMessage.set(this.translationService.translate('profile.updateSuccess'));
      },
      error: (err) => {
        this.isSaving.set(false);
        const errors = this.authService.extractValidationErrors(err);
        if (Object.keys(errors).length > 0) {
          this.validationErrors.set(errors);
        } else {
          this.generalError.set(this.translationService.translate('profile.updateError'));
        }
      }
    });
  }
}
