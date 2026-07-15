import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InstructorService } from '../../../infrastructure/services/instructor/instructor.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';

@Component({
  selector: 'app-join-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-us.component.html',
  styleUrls: ['./join-us.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JoinUsComponent {
  private instructorService = inject(InstructorService);
  private layout = inject(AppLayoutComponent);
  private router = inject(Router);

  lang = this.layout.currentLang;

  // Wizard state
  step = signal<number>(1);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  validationErrors = signal<Record<string, string[]>>({});

  // Step 1: Personal Info
  firstName = signal<string>('');
  secondName = signal<string>('');
  thirdName = signal<string>('');
  lastName = signal<string>('');
  emailAddress = signal<string>('');
  phoneNumber = signal<string>('');
  governorate = signal<string>('');
  address = signal<string>('');
  profileImageFile = signal<File | null>(null);
  profileImagePreview = signal<string | null>(null);

  // Step 2: Professional Info
  specialization = signal<string>('');
  previousExperienceText = signal<string>('');
  valueAdditionText = signal<string>('');

  // Step 3: Social & Portfolios
  facebookLink = signal<string>('');
  instagramLink = signal<string>('');
  personalWebsiteOrBehanceLink = signal<string>('');

  // Step 4: Documents Upload
  nationalIdCardImageFile = signal<File | null>(null);
  nationalIdPreview = signal<string | null>(null);
  cvOrPortfolioFile = signal<File | null>(null);
  cvFileName = signal<string | null>(null);

  // Governorate list for Egypt
  governorates = [
    { en: 'Cairo', ar: 'القاهرة' },
    { en: 'Giza', ar: 'الجيزة' },
    { en: 'Alexandria', ar: 'الإسكندرية' },
    { en: 'Qalyubia', ar: 'القليوبية' },
    { en: 'Gharbia', ar: 'الغربية' },
    { en: 'Dakahlia', ar: 'الدقهلية' },
    { en: 'Beheira', ar: 'البحيرة' },
    { en: 'Sharqia', ar: 'الشرقية' },
    { en: 'Monufia', ar: 'المنوفية' },
    { en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
    { en: 'Damietta', ar: 'دمياط' },
    { en: 'Port Said', ar: 'بورسعيد' },
    { en: 'Ismailia', ar: 'الإسماعيلية' },
    { en: 'Suez', ar: 'السويس' },
    { en: 'Fayoum', ar: 'الفيوم' },
    { en: 'Beni Suef', ar: 'بني سويف' },
    { en: 'Minya', ar: 'المنيا' },
    { en: 'Assiut', ar: 'أسيوط' },
    { en: 'Sohag', ar: 'سوهاج' },
    { en: 'Qena', ar: 'قنا' },
    { en: 'Luxor', ar: 'الأقصر' },
    { en: 'Aswan', ar: 'أسوان' },
    { en: 'Red Sea', ar: 'البحر الأحمر' },
    { en: 'New Valley', ar: 'الوادي الجديد' },
    { en: 'Matrouh', ar: 'مطروح' },
    { en: 'North Sinai', ar: 'شمال سيناء' },
    { en: 'South Sinai', ar: 'جنوب سيناء' }
  ];

  nextStep(): void {
    if (this.validateStep(this.step())) {
      this.step.update(s => s + 1);
      this.errorMessage.set('');
    } else {
      this.errorMessage.set(
        this.lang() === 'ar' 
          ? 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح قبل الانتقال للخطوة التالية.' 
          : 'Please fill in all required fields correctly before moving to the next step.'
      );
    }
  }

  prevStep(): void {
    this.step.update(s => s - 1);
    this.errorMessage.set('');
  }

  goToStep(stepNum: number): void {
    if (stepNum < this.step()) {
      this.step.set(stepNum);
      this.errorMessage.set('');
    } else {
      // Validate up to the targeted step
      for (let i = 1; i < stepNum; i++) {
        if (!this.validateStep(i)) {
          this.errorMessage.set(
            this.lang() === 'ar' 
              ? `يرجى إكمال الحقول المطلوبة في الخطوة ${i} أولاً.` 
              : `Please complete the required fields in Step ${i} first.`
          );
          return;
        }
      }
      this.step.set(stepNum);
      this.errorMessage.set('');
    }
  }

  onFileSelected(event: Event, type: 'nationalId' | 'cv' | 'profile'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (type === 'profile') {
        this.profileImageFile.set(file);
        const reader = new FileReader();
        reader.onload = () => this.profileImagePreview.set(reader.result as string);
        reader.readAsDataURL(file);
      } else if (type === 'nationalId') {
        this.nationalIdCardImageFile.set(file);
        const reader = new FileReader();
        reader.onload = () => this.nationalIdPreview.set(reader.result as string);
        reader.readAsDataURL(file);
      } else if (type === 'cv') {
        this.cvOrPortfolioFile.set(file);
        this.cvFileName.set(file.name);
      }
    }
  }

  validateStep(stepNum: number): boolean {
    if (stepNum === 1) {
      return !!(
        this.firstName().trim() &&
        this.secondName().trim() &&
        this.lastName().trim() &&
        this.emailAddress().trim() &&
        this.phoneNumber().trim() &&
        this.governorate() &&
        this.address().trim()
      );
    }
    if (stepNum === 2) {
      return !!(
        this.specialization().trim() &&
        this.valueAdditionText().trim()
      );
    }
    if (stepNum === 3) {
      // Step 3 (Social Links) has optional fields, so it's always valid
      return true;
    }
    if (stepNum === 4) {
      return !!(
        this.nationalIdCardImageFile() &&
        this.cvOrPortfolioFile()
      );
    }
    return false;
  }

  submitApplication(): void {
    if (!this.validateStep(4)) {
      this.errorMessage.set(
        this.lang() === 'ar' 
          ? 'يرجى تحميل جميع المستندات المطلوبة في الخطوة الأخيرة.' 
          : 'Please upload all required files in the final step.'
      );
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.validationErrors.set({});

    const formData = new FormData();
    formData.append('specialization', this.specialization());
    formData.append('firstName', this.firstName());
    formData.append('secondName', this.secondName());
    formData.append('thirdName', this.thirdName());
    formData.append('lastName', this.lastName());
    formData.append('phoneNumber', this.phoneNumber());
    formData.append('emailAddress', this.emailAddress());
    formData.append('governorate', this.governorate());
    formData.append('address', this.address());
    formData.append('valueAdditionText', this.valueAdditionText());
    formData.append('previousExperienceText', this.previousExperienceText() || '');
    formData.append('facebookLink', this.facebookLink() || '');
    formData.append('instagramLink', this.instagramLink() || '');
    formData.append('personalWebsiteOrBehanceLink', this.personalWebsiteOrBehanceLink() || '');

    // Files
    const natIdFile = this.nationalIdCardImageFile();
    if (natIdFile) formData.append('nationalIdCardImage', natIdFile);

    const cvFile = this.cvOrPortfolioFile();
    if (cvFile) formData.append('cvOrPortfolio', cvFile);

    const profImage = this.profileImageFile();
    if (profImage) formData.append('profileImage', profImage);

    this.instructorService.submitInstructorApplication(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          this.lang() === 'ar' 
            ? 'تم إرسال طلبك بنجاح! سنقوم بمراجعة طلبك والتواصل معك قريباً عبر البريد الإلكتروني.' 
            : 'Your application has been submitted successfully! We will review your files and contact you via email shortly.'
        );
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        if (err.status === 400 || err.status === 422) {
          const errors = err.error?.errors || {};
          this.validationErrors.set(errors);
        }
        this.errorMessage.set(
          err.error?.Message || err.error?.message || 
          (this.lang() === 'ar' ? 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'An error occurred during submission. Please try again.')
        );
      }
    });
  }

  resetForm(): void {
    this.step.set(1);
    this.firstName.set('');
    this.secondName.set('');
    this.thirdName.set('');
    this.lastName.set('');
    this.emailAddress.set('');
    this.phoneNumber.set('');
    this.governorate.set('');
    this.address.set('');
    this.profileImageFile.set(null);
    this.profileImagePreview.set(null);
    this.specialization.set('');
    this.previousExperienceText.set('');
    this.valueAdditionText.set('');
    this.facebookLink.set('');
    this.instagramLink.set('');
    this.personalWebsiteOrBehanceLink.set('');
    this.nationalIdCardImageFile.set(null);
    this.nationalIdPreview.set(null);
    this.cvOrPortfolioFile.set(null);
    this.cvFileName.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.validationErrors.set({});
  }

  goBackToHome(): void {
    this.router.navigate(['/']);
  }
}
