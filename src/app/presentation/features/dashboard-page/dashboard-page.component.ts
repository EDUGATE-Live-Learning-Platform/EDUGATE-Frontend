import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CourseService } from '../../../infrastructure/services/course/course.service';
import { WalletService } from '../../../infrastructure/services/wallet/wallet.service';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import { StudentDashboardResponse, StudentDashboardSummary } from '../../../core/models/course-catalog.model';
import { TransactionDto } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit {
  courseService = inject(CourseService);
  walletService = inject(WalletService);
  authService = inject(AuthService);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);
  router = inject(Router);

  lang = this.layout.currentLang;
  t = this.translationService.translations;
  user = this.authService.currentUser;

  // State signals
  summary = signal<StudentDashboardSummary | null>(null);
  enrolledCourses = signal<StudentDashboardResponse[]>([]);
  recentTransactions = signal<TransactionDto[]>([]);
  isLoading = signal<boolean>(true);

  // Computed signals
  overallProgress = computed(() => {
    const courses = this.enrolledCourses();
    if (courses.length === 0) return 0;
    const total = courses.reduce((sum, c) => sum + c.progressPercentage, 0);
    return Math.round(total / courses.length);
  });

  // Calculate the stroke dashoffset for the SVG progress circle (r=58, circumference=364.4)
  strokeDashoffset = computed(() => {
    const progress = this.overallProgress();
    return 364.4 - (progress / 100) * 364.4;
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    // Fetch enrolled courses
    this.courseService.getStudentDashboard().subscribe({
      next: (courses) => {
        this.enrolledCourses.set(courses);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // Fetch dashboard summary
    this.courseService.getStudentDashboardSummary().subscribe({
      next: (summaryData) => {
        this.summary.set(summaryData);
      }
    });

    // Fetch wallet balance and recent transactions
    this.walletService.getWallet().subscribe();
    this.walletService.getTransactions().subscribe({
      next: (txs) => {
        // Limit to top 3 transactions
        this.recentTransactions.set(txs.slice(0, 3));
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getResumeLearningUrl(): string {
    const summaryData = this.summary();
    if (summaryData?.resumeLearning) {
      return `/learn/${summaryData.resumeLearning.courseId}`;
    }
    return '/courses';
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0h';
    const hours = Math.round((seconds / 3600) * 10) / 10;
    return this.lang() === 'ar' ? `${hours} ساعة` : `${hours}h`;
  }
}
