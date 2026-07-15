import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CourseService } from '../../../../infrastructure/services/course/course.service';
import { AuthService } from '../../../../infrastructure/auth/auth.service';
import { WalletService } from '../../../../infrastructure/services/wallet/wallet.service';
import { SecureMediaService } from '../../../../infrastructure/services/security/secure-media.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AppLayoutComponent } from '../../../layouts/app-layout/app-layout.component';
import { CourseDetails } from '../../../../core/models/course-catalog.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  courseService = inject(CourseService);
  authService = inject(AuthService);
  walletService = inject(WalletService);
  secureMediaService = inject(SecureMediaService);
  translationService = inject(TranslationService);
  toastService = inject(ToastService);
  layout = inject(AppLayoutComponent);

  private destroy$ = new Subject<void>();

  // Expose signals to template
  lang = this.layout.currentLang;
  t = this.translationService.translations;
  currentUser = this.authService.currentUser;

  // Route state
  courseId = signal<string>('');
  course = signal<CourseDetails | null>(null);
  isLoading = signal<boolean>(false);
  isEnrolled = signal<boolean>(false);

  // Accordion collapsed state record
  collapsedSections = signal<Record<string, boolean>>({});

  // Modals signals
  showAuthModal = signal<boolean>(false);
  showPurchaseConfirmModal = signal<boolean>(false);
  showDepositModal = signal<boolean>(false);
  previewVideoUrl = signal<string | null>(null);

  // Modal Login form signals
  loginEmail = signal<string>('');
  loginPassword = signal<string>('');
  isSubmittingLogin = signal<boolean>(false);
  loginError = signal<string | null>(null);

  // Checkout signals
  isLoadingBalance = signal<boolean>(false);
  isPurchasing = signal<boolean>(false);
  isDepositing = signal<boolean>(false);
  topupAmount = signal<number>(0);
  generalError = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadCourseDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourseDetails(): void {
    this.isLoading.set(true);
    this.courseService.getCourseDetails(this.courseId()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.course.set(res);
        
        // Infer enrollment status: if any non-preview lesson has a videoUrl, student is enrolled
        const hasLessons = res.sections.some(s => s.lessons.length > 0);
        const hasAccessibleNonPreview = res.sections.some(s => 
          s.lessons.some(l => !l.isPreview && l.videoUrl)
        );
        this.isEnrolled.set(hasLessons && hasAccessibleNonPreview);

        // Collapse all sections by default initially
        const collapseMap: Record<string, boolean> = {};
        res.sections.forEach((s, idx) => {
          // Keep first section expanded, collapse others
          collapseMap[s.id] = idx > 0;
        });
        this.collapsedSections.set(collapseMap);
      },
      error: () => {
        this.isLoading.set(false);
        this.course.set(null);
      }
    });
  }

  toggleSection(sectionId: string): void {
    this.collapsedSections.update(states => ({
      ...states,
      [sectionId]: !states[sectionId]
    }));
  }

  getEffectivePrice(): number {
    const course = this.course();
    if (!course) return 0;
    if (course.discountPrice && this.isDiscountActive(course)) {
      return course.discountPrice;
    }
    return course.price;
  }

  isDiscountActive(course: CourseDetails): boolean {
    if (!course.discountPrice) return false;
    const now = new Date();
    if (course.discountStartDateUtc && new Date(course.discountStartDateUtc) > now) return false;
    if (course.discountEndDateUtc && new Date(course.discountEndDateUtc) < now) return false;
    return true;
  }

  onEnrollClick(): void {
    const user = this.currentUser();
    if (!user) {
      // Clear form
      this.loginEmail.set('');
      this.loginPassword.set('');
      this.loginError.set(null);
      this.showAuthModal.set(true);
      return;
    }

    if (user.Role !== 'Student') {
      this.toastService.warning('Access Restricted', this.translationService.translate('detail.studentOnlyAlert'));
      return;
    }

    this.isLoadingBalance.set(true);
    this.generalError.set(null);

    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.isLoadingBalance.set(false);
        const price = this.getEffectivePrice();
        if (wallet.balance >= price) {
          this.showPurchaseConfirmModal.set(true);
        } else {
          // Pre-fill difference needed
          this.topupAmount.set(price - wallet.balance);
          this.showDepositModal.set(true);
        }
      },
      error: () => {
        this.isLoadingBalance.set(false);
        this.generalError.set('Could not check wallet balance. Please try again.');
      }
    });
  }

  onSubmitLogin(): void {
    if (this.isSubmittingLogin()) return;
    this.isSubmittingLogin.set(true);
    this.loginError.set(null);

    this.authService.login({
      Email: this.loginEmail(),
      Password: this.loginPassword(),
      RememberMe: false
    }).subscribe({
      next: () => {
        this.isSubmittingLogin.set(false);
        this.showAuthModal.set(false);
        // Continue checkout flow instantly for premium UX
        this.onEnrollClick();
      },
      error: () => {
        this.isSubmittingLogin.set(false);
        this.loginError.set(this.translationService.translate('login.unauthorizedError'));
      }
    });
  }

  confirmPurchase(): void {
    const course = this.course();
    if (!course || this.isPurchasing()) return;

    this.isPurchasing.set(true);
    this.courseService.purchaseCourse(course.id).subscribe({
      next: () => {
        this.isPurchasing.set(false);
        this.showPurchaseConfirmModal.set(false);
        this.isEnrolled.set(true);
        this.router.navigate(['/learn', course.id]);
      },
      error: (err) => {
        this.isPurchasing.set(false);
        this.toastService.error('Purchase Failed', err.error?.message || 'Something went wrong. Please try again.');
      }
    });
  }

  confirmDeposit(): void {
    if (this.isDepositing() || this.topupAmount() <= 0) return;

    this.isDepositing.set(true);
    this.walletService.deposit(this.topupAmount()).subscribe({
      next: () => {
        this.isDepositing.set(false);
        this.showDepositModal.set(false);
        // Refresh wallet balance and continue flow
        this.onEnrollClick();
      },
      error: () => {
        this.isDepositing.set(false);
        this.toastService.error('Deposit Failed', 'Could not process your deposit. Please try again.');
      }
    });
  }

  triggerPreview(videoUrl: string): void {
    this.previewVideoUrl.set(videoUrl);
  }

  closePreview(): void {
    this.previewVideoUrl.set(null);
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  watchPreview(lesson: any): void {
    this.secureMediaService.getSignedUrl(lesson.id).subscribe({
      next: (signedUrl) => {
        this.triggerPreview(signedUrl);
      },
      error: (err) => {
        console.error('Failed to load signed preview URL', err);
        this.toastService.error('Preview Unavailable', 'Failed to load preview video.');
      }
    });
  }

  goToStudy(): void {
    const course = this.course();
    if (course) {
      this.router.navigate(['/learn', course.id]);
    }
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
  }

  closePurchaseModal(): void {
    this.showPurchaseConfirmModal.set(false);
  }

  closeDepositModal(): void {
    this.showDepositModal.set(false);
  }

  closeAuthAndGoToRegister(): void {
    this.showAuthModal.set(false);
    this.router.navigate(['/register']);
  }
}
