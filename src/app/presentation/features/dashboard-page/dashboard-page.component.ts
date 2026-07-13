import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../infrastructure/services/course/course.service';
import { WalletService } from '../../../infrastructure/services/wallet/wallet.service';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import { StudentDashboardResponse, StudentDashboardSummary, CalendarEvent } from '../../../core/models/course-catalog.model';
import { TransactionDto } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  wallet = this.walletService.walletData; // Expose live wallet details

  // State signals
  summary = signal<StudentDashboardSummary | null>(null);
  enrolledCourses = signal<StudentDashboardResponse[]>([]);
  recentTransactions = signal<TransactionDto[]>([]);
  calendarEvents = signal<CalendarEvent[]>([]);
  isLoading = signal<boolean>(true);

  // Modal signals
  showCalendarModal = signal<boolean>(false);
  newEventTitle = signal<string>('');
  newEventDescription = signal<string>('');
  newEventDate = signal<string>('');
  newEventTime = signal<string>('');
  newEventType = signal<string>('Personal'); // Exam, Assignment, Internship, Personal
  isAddingEvent = signal<boolean>(false);
  eventError = signal<string>('');

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
    // Refresh user profile details to fetch latest last login and grades
    this.authService.getProfile().subscribe();
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

    // Fetch calendar events
    this.courseService.getCalendarEvents().subscribe({
      next: (res) => {
        this.calendarEvents.set(res.Data || []);
      },
      error: (err) => console.error('Failed to load calendar events', err)
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

  openAddEventModal(): void {
    this.newEventTitle.set('');
    this.newEventDescription.set('');
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.newEventDate.set(tomorrow.toISOString().split('T')[0]);
    this.newEventTime.set('10:00');
    this.newEventType.set('Personal');
    this.eventError.set('');
    this.showCalendarModal.set(true);
  }

  closeAddEventModal(): void {
    this.showCalendarModal.set(false);
  }

  submitCalendarEvent(): void {
    if (!this.newEventTitle().trim()) {
      this.eventError.set(this.lang() === 'ar' ? 'عنوان الحدث مطلوب.' : 'Event title is required.');
      return;
    }
    if (!this.newEventDate()) {
      this.eventError.set(this.lang() === 'ar' ? 'تاريخ الحدث مطلوب.' : 'Event date is required.');
      return;
    }

    this.isAddingEvent.set(true);
    this.eventError.set('');

    const time = this.newEventTime() || '00:00';
    const combinedDateTime = new Date(`${this.newEventDate()}T${time}:00`).toISOString();

    const newEvent: CalendarEvent = {
      title: this.newEventTitle(),
      description: this.newEventDescription(),
      eventDate: combinedDateTime,
      eventType: this.newEventType()
    };

    this.courseService.addCalendarEvent(newEvent).subscribe({
      next: () => {
        this.isAddingEvent.set(false);
        this.showCalendarModal.set(false);
        this.loadDashboardData(); // Refresh list
      },
      error: (err) => {
        this.isAddingEvent.set(false);
        this.eventError.set(err.error?.Message || 'Failed to create event');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
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
