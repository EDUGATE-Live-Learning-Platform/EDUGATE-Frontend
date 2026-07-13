import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InstructorStudioService } from '../../../infrastructure/services/instructor/instructor-studio.service';
import { CourseService } from '../../../infrastructure/services/course/course.service';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import {
  InstructorDashboardSummary,
  InstructorCourseReportItem,
  InstructorReviewFeedItem,
  InstructorProfileView,
  CreateCourseDto,
  UpdateCourseDto
} from '../../../core/models/instructor-dashboard.model';
import { CourseDetails, SectionResponse, LessonResponse } from '../../../core/models/course-catalog.model';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstructorDashboardComponent implements OnInit {
  private studioService = inject(InstructorStudioService);
  private courseService = inject(CourseService);
  private authService = inject(AuthService);
  private layout = inject(AppLayoutComponent);
  private translationService = inject(TranslationService);
  private router = inject(Router);

  lang = this.layout.currentLang;
  t = this.translationService.translations;
  user = this.authService.currentUser;

  // Active Tab
  activeTab = signal<'overview' | 'courses' | 'curriculum' | 'profile'>('overview');

  // Stats / Dashboard Signals
  summary = signal<InstructorDashboardSummary | null>(null);
  coursesReport = signal<InstructorCourseReportItem[]>([]);
  recentReviews = signal<InstructorReviewFeedItem[]>([]);
  profile = signal<InstructorProfileView | null>(null);
  isLoading = signal<boolean>(true);

  // Curriculum Builder Selected Course
  selectedCourseId = signal<string>('');
  selectedCourseDetails = signal<CourseDetails | null>(null);
  isLoadingCurriculum = signal<boolean>(false);
  expandedSections = signal<Record<string, boolean>>({});

  // Dialog Modals State
  showCourseModal = signal<boolean>(false);
  isEditingCourse = signal<boolean>(false);
  editingCourseId = signal<string>('');
  
  showSectionModal = signal<boolean>(false);
  showLessonModal = signal<boolean>(false);
  isEditingLesson = signal<boolean>(false);
  editingLessonId = signal<string>('');
  selectedSectionIdForLesson = signal<string>('');

  // Course Form Inputs
  courseTitle = signal<string>('');
  courseSubtitle = signal<string>('');
  courseDescription = signal<string>('');
  coursePrice = signal<number>(0);
  courseCategory = signal<string>('');
  
  // Advanced Edit Inputs
  courseDiscountPrice = signal<number>(0);
  courseDiscountStart = signal<string>('');
  courseDiscountEnd = signal<string>('');
  courseRequirements = signal<string>('');
  courseOutcomes = signal<string>('');
  
  // Section Form Inputs
  sectionTitle = signal<string>('');
  sectionOrder = signal<number>(1);

  // Lesson Form Inputs
  lessonTitle = signal<string>('');
  lessonDescription = signal<string>('');
  lessonDuration = signal<number>(180);
  lessonOrder = signal<number>(1);
  lessonIsPreview = signal<boolean>(false);
  selectedVideoFile: File | null = null;
  selectedThumbnailFile: File | null = null;

  // File preview references
  videoFileName = signal<string>('');
  thumbnailFileName = signal<string>('');

  // Error/Success alerts
  formErrorMessage = signal<string>('');
  isSubmitting = signal<boolean>(false);

  // Attachment upload signals
  activeLessonIdForAttachment = signal<string>('');
  showAttachmentModal = signal<boolean>(false);
  selectedAttachmentFile: File | null = null;
  attachmentFileName = signal<string>('');

  ngOnInit(): void {
    // Re-verify that user has instructor permissions, otherwise boot to home
    const currentUser = this.user();
    if (!currentUser || currentUser.Role !== 'Instructor') {
      this.router.navigate(['/home']);
      return;
    }
    this.loadAllDashboardData();
  }

  loadAllDashboardData(): void {
    this.isLoading.set(true);
    
    // Load summary metrics
    this.studioService.getDashboardSummary().subscribe({
      next: (res) => this.summary.set(res),
      error: (err) => console.error('Failed to load dashboard summary', err)
    });

    // Load course statistics report
    this.studioService.getCoursesReport().subscribe({
      next: (res) => {
        this.coursesReport.set(res || []);
        // Automatically select the first course for curriculum builder if available
        if (res && res.length > 0 && !this.selectedCourseId()) {
          this.selectCourseForCurriculum(res[0].courseId);
        }
      },
      error: (err) => console.error('Failed to load courses report', err)
    });

    // Load recent reviews
    this.studioService.getRecentReviews().subscribe({
      next: (res) => this.recentReviews.set(res || []),
      error: (err) => console.error('Failed to load recent reviews', err)
    });

    // Load profile
    this.studioService.getInstructorProfile().subscribe({
      next: (res) => {
        this.profile.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load instructor profile', err);
        this.isLoading.set(false);
      }
    });
  }

  // ----------------- Tab Navigation -----------------
  switchTab(tab: 'overview' | 'courses' | 'curriculum' | 'profile'): void {
    this.activeTab.set(tab);
    if (tab === 'overview') {
      this.loadAllDashboardData();
    }
  }

  // ----------------- Curriculum Navigation -----------------
  selectCourseForCurriculum(courseId: string): void {
    this.selectedCourseId.set(courseId);
    this.loadCourseCurriculumTree(courseId);
  }

  loadCourseCurriculumTree(courseId: string): void {
    this.isLoadingCurriculum.set(true);
    this.courseService.getCourseDetails(courseId).subscribe({
      next: (details) => {
        this.selectedCourseDetails.set(details);
        this.isLoadingCurriculum.set(false);
        // By default expand all sections
        if (details && details.sections) {
          const expandMap: Record<string, boolean> = {};
          details.sections.forEach(s => {
            expandMap[s.id] = true;
          });
          this.expandedSections.set(expandMap);
        }
      },
      error: (err) => {
        console.error('Failed to load course details for curriculum', err);
        this.isLoadingCurriculum.set(false);
      }
    });
  }

  toggleSectionExpanded(sectionId: string): void {
    const prev = this.expandedSections();
    this.expandedSections.set({
      ...prev,
      [sectionId]: !prev[sectionId]
    });
  }

  // ----------------- Course Creation & Editing -----------------
  openCreateCourseModal(): void {
    this.isEditingCourse.set(false);
    this.editingCourseId.set('');
    this.courseTitle.set('');
    this.courseSubtitle.set('');
    this.courseDescription.set('');
    this.coursePrice.set(99);
    this.courseCategory.set('Development');
    this.courseDiscountPrice.set(0);
    this.courseDiscountStart.set('');
    this.courseDiscountEnd.set('');
    this.courseRequirements.set('');
    this.courseOutcomes.set('');
    this.selectedThumbnailFile = null;
    this.thumbnailFileName.set('');
    this.formErrorMessage.set('');
    this.showCourseModal.set(true);
  }

  openEditCourseModal(course: InstructorCourseReportItem): void {
    this.isEditingCourse.set(true);
    this.editingCourseId.set(course.courseId);
    this.formErrorMessage.set('');
    this.isLoadingCurriculum.set(true);

    this.courseService.getCourseDetails(course.courseId).subscribe({
      next: (details) => {
        this.courseTitle.set(details.title);
        this.courseSubtitle.set(details.subtitle || '');
        this.courseDescription.set(details.description);
        this.coursePrice.set(details.price);
        this.courseCategory.set(details.category || 'Development');
        this.courseDiscountPrice.set(details.discountPrice || 0);
        this.courseDiscountStart.set(details.discountStartDateUtc ? details.discountStartDateUtc.substring(0, 16) : '');
        this.courseDiscountEnd.set(details.discountEndDateUtc ? details.discountEndDateUtc.substring(0, 16) : '');
        this.courseRequirements.set(details.requirements ? details.requirements.join('\n') : '');
        this.courseOutcomes.set(details.outcomes ? details.outcomes.join('\n') : '');
        this.selectedThumbnailFile = null;
        this.thumbnailFileName.set('');
        
        this.isLoadingCurriculum.set(false);
        this.showCourseModal.set(true);
      },
      error: (err) => {
        console.error('Failed to load course details for editing', err);
        this.isLoadingCurriculum.set(false);
      }
    });
  }

  onThumbnailSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedThumbnailFile = file;
      this.thumbnailFileName.set(file.name);
    }
  }

  saveCourse(): void {
    if (!this.courseTitle().trim() || !this.courseDescription().trim() || !this.courseCategory().trim()) {
      this.formErrorMessage.set('Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.formErrorMessage.set('');

    const baseDto: CreateCourseDto = {
      title: this.courseTitle().trim(),
      subtitle: this.courseSubtitle().trim(),
      description: this.courseDescription().trim(),
      price: this.coursePrice(),
      category: this.courseCategory().trim()
    };

    if (this.isEditingCourse()) {
      const requirementsList = this.courseRequirements().split('\n').map(r => r.trim()).filter(Boolean);
      const outcomesList = this.courseOutcomes().split('\n').map(o => o.trim()).filter(Boolean);
      
      const updateDto: UpdateCourseDto = {
        ...baseDto,
        discountPrice: this.courseDiscountPrice(),
        discountStartDateUtc: this.courseDiscountStart() ? new Date(this.courseDiscountStart()).toISOString() : undefined,
        discountEndDateUtc: this.courseDiscountEnd() ? new Date(this.courseDiscountEnd()).toISOString() : undefined,
        requirements: requirementsList,
        outcomes: outcomesList
      };

      this.studioService.updateCourse(this.editingCourseId(), updateDto).subscribe({
        next: () => {
          if (this.selectedThumbnailFile) {
            this.uploadCourseThumbnail(this.editingCourseId());
          } else {
            this.finishCourseSave();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formErrorMessage.set(err.error?.message || 'Failed to update course.');
        }
      });
    } else {
      this.studioService.createCourse(baseDto).subscribe({
        next: (res) => {
          const newCourseId = res?.data || res?.Data || res;
          if (this.selectedThumbnailFile && newCourseId) {
            this.uploadCourseThumbnail(newCourseId);
          } else {
            this.finishCourseSave();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formErrorMessage.set(err.error?.message || 'Failed to create course.');
        }
      });
    }
  }

  uploadCourseThumbnail(courseId: string): void {
    if (!this.selectedThumbnailFile) return;
    this.studioService.uploadCourseMedia(courseId, this.selectedThumbnailFile).subscribe({
      next: () => this.finishCourseSave(),
      error: (err) => {
        this.isSubmitting.set(false);
        this.formErrorMessage.set('Course saved, but thumbnail upload failed.');
      }
    });
  }

  finishCourseSave(): void {
    this.isSubmitting.set(false);
    this.showCourseModal.set(false);
    this.loadAllDashboardData();
  }

  togglePublishCourse(course: InstructorCourseReportItem, currentStatus: string): void {
    const isPublished = currentStatus === 'Published';
    const request$ = isPublished
      ? this.studioService.unpublishCourse(course.courseId)
      : this.studioService.publishCourse(course.courseId);

    request$.subscribe({
      next: () => {
        this.loadAllDashboardData();
        if (this.selectedCourseId() === course.courseId) {
          this.loadCourseCurriculumTree(course.courseId);
        }
      },
      error: (err) => console.error('Failed to change course publish status', err)
    });
  }

  // ----------------- Section Management -----------------
  openCreateSectionModal(): void {
    if (!this.selectedCourseId()) return;
    this.sectionTitle.set('');
    this.sectionOrder.set((this.selectedCourseDetails()?.sections?.length || 0) + 1);
    this.formErrorMessage.set('');
    this.showSectionModal.set(true);
  }

  saveSection(): void {
    if (!this.sectionTitle().trim()) {
      this.formErrorMessage.set('Section title is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.studioService.createSection(this.selectedCourseId(), {
      title: this.sectionTitle().trim(),
      order: this.sectionOrder()
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showSectionModal.set(false);
        this.loadCourseCurriculumTree(this.selectedCourseId());
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formErrorMessage.set(err.error?.message || 'Failed to create section.');
      }
    });
  }

  // ----------------- Lesson Management -----------------
  openCreateLessonModal(sectionId: string): void {
    this.isEditingLesson.set(false);
    this.editingLessonId.set('');
    this.selectedSectionIdForLesson.set(sectionId);
    this.lessonTitle.set('');
    this.lessonDescription.set('');
    this.lessonDuration.set(120);
    
    // Find next order
    const section = this.selectedCourseDetails()?.sections?.find(s => s.id === sectionId);
    this.lessonOrder.set((section?.lessons?.length || 0) + 1);
    
    this.lessonIsPreview.set(false);
    this.selectedVideoFile = null;
    this.videoFileName.set('');
    this.formErrorMessage.set('');
    this.showLessonModal.set(true);
  }

  openEditLessonModal(lesson: LessonResponse, sectionId: string): void {
    this.isEditingLesson.set(true);
    this.editingLessonId.set(lesson.id);
    this.selectedSectionIdForLesson.set(sectionId);
    this.lessonTitle.set(lesson.title);
    this.lessonDescription.set(lesson.description || '');
    this.lessonDuration.set(lesson.durationInSeconds);
    this.lessonOrder.set(lesson.order);
    this.lessonIsPreview.set(lesson.isPreview);
    this.selectedVideoFile = null;
    this.videoFileName.set('');
    this.formErrorMessage.set('');
    this.showLessonModal.set(true);
  }

  onVideoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedVideoFile = file;
      this.videoFileName.set(file.name);
    }
  }

  saveLesson(): void {
    if (!this.lessonTitle().trim()) {
      this.formErrorMessage.set('Lesson title is required.');
      return;
    }

    if (!this.isEditingLesson() && !this.selectedVideoFile) {
      this.formErrorMessage.set('Video file is required for new lessons.');
      return;
    }

    this.isSubmitting.set(true);
    this.formErrorMessage.set('');

    const lessonData = {
      title: this.lessonTitle().trim(),
      description: this.lessonDescription().trim(),
      durationInSeconds: this.lessonDuration(),
      order: this.lessonOrder(),
      isPreview: this.lessonIsPreview(),
      videoFile: this.selectedVideoFile || undefined
    };

    const request$ = this.isEditingLesson()
      ? this.studioService.updateLesson(this.editingLessonId(), lessonData)
      : this.studioService.createLesson(this.selectedSectionIdForLesson(), lessonData);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showLessonModal.set(false);
        this.loadCourseCurriculumTree(this.selectedCourseId());
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formErrorMessage.set(err.error?.message || 'Failed to save lesson.');
      }
    });
  }

  deleteLesson(lessonId: string): void {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    this.isLoadingCurriculum.set(true);
    this.studioService.deleteLesson(lessonId).subscribe({
      next: () => {
        this.loadCourseCurriculumTree(this.selectedCourseId());
      },
      error: (err) => {
        console.error('Failed to delete lesson', err);
        this.isLoadingCurriculum.set(false);
      }
    });
  }

  // ----------------- Lesson Attachments -----------------
  openAttachmentModal(lessonId: string): void {
    this.activeLessonIdForAttachment.set(lessonId);
    this.selectedAttachmentFile = null;
    this.attachmentFileName.set('');
    this.formErrorMessage.set('');
    this.showAttachmentModal.set(true);
  }

  onAttachmentSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedAttachmentFile = file;
      this.attachmentFileName.set(file.name);
    }
  }

  saveAttachment(): void {
    if (!this.selectedAttachmentFile) {
      this.formErrorMessage.set('Please choose a file to upload.');
      return;
    }

    this.isSubmitting.set(true);
    this.formErrorMessage.set('');

    this.studioService.uploadLessonAttachment(this.activeLessonIdForAttachment(), this.selectedAttachmentFile).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showAttachmentModal.set(false);
        this.loadCourseCurriculumTree(this.selectedCourseId());
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formErrorMessage.set(err.error?.message || 'Failed to upload attachment.');
      }
    });
  }

  // Helper: get full resource url prepending backend host if relative
  getMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = 'https://localhost:7098';
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }
}
