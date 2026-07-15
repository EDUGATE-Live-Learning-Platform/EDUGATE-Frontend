import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, untracked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { switchMap, filter, tap } from 'rxjs/operators';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
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

  // Trigger to reload stats data reactively
  private refreshTrigger = signal<number>(0);
  isLoading = signal<boolean>(true);

  // Declarative parallel coordinated state loading
  private dashboardData = toSignal(
    toObservable(this.refreshTrigger).pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => forkJoin({
        summary: this.studioService.getDashboardSummary(),
        coursesReport: this.studioService.getCoursesReport(),
        recentReviews: this.studioService.getRecentReviews(),
        profile: this.studioService.getInstructorProfile()
      })),
      tap(() => this.isLoading.set(false))
    )
  );

  // Deriving read-only computed signals from dashboardData
  summary = computed(() => this.dashboardData()?.summary ?? null);
  coursesReport = computed(() => this.dashboardData()?.coursesReport ?? []);
  recentReviews = computed(() => this.dashboardData()?.recentReviews ?? []);
  profile = computed(() => this.dashboardData()?.profile ?? null);

  // Curriculum Builder Selected Course
  selectedCourseId = signal<string>('');
  isLoadingCurriculum = signal<boolean>(false);

  selectedCourseDetails = toSignal(
    toObservable(this.selectedCourseId).pipe(
      filter(id => !!id),
      tap(() => this.isLoadingCurriculum.set(true)),
      switchMap(id => this.courseService.getCourseDetails(id)),
      tap(() => this.isLoadingCurriculum.set(false))
    ),
    { initialValue: null }
  );

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

  // Reactive Form Groups
  courseForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    subtitle: new FormControl(''),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl(99, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    category: new FormControl('Development', { nonNullable: true, validators: [Validators.required] }),
    discountPrice: new FormControl(0),
    discountStartDateUtc: new FormControl(''),
    discountEndDateUtc: new FormControl(''),
    requirements: new FormControl(''),
    outcomes: new FormControl('')
  });

  sectionForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    order: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] })
  });

  lessonForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl(''),
    durationInSeconds: new FormControl(180, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    order: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    isPreview: new FormControl(false, { nonNullable: true })
  });

  // Upload references
  selectedVideoFile: File | null = null;
  selectedThumbnailFile: File | null = null;
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

  constructor() {
    // Auto-select the first course when coursesReport gets loaded
    effect(() => {
      const report = this.coursesReport();
      if (report && report.length > 0 && !this.selectedCourseId()) {
        untracked(() => {
          this.selectCourseForCurriculum(report[0].courseId);
        });
      }
    });

    // Auto-expand all sections when details loaded
    effect(() => {
      const details = this.selectedCourseDetails();
      if (details && details.sections) {
        untracked(() => {
          const expandMap: Record<string, boolean> = {};
          details.sections.forEach(s => {
            expandMap[s.id] = true;
          });
          this.expandedSections.set(expandMap);
        });
      }
    });
  }

  ngOnInit(): void {
    const currentUser = this.user();
    if (!currentUser || currentUser.Role !== 'Instructor') {
      this.router.navigate(['/home']);
      return;
    }
  }

  loadAllDashboardData(): void {
    this.refreshTrigger.update(n => n + 1);
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
  }

  // Helper trigger to explicitly reload the curriculum tree
  loadCourseCurriculumTree(courseId: string): void {
    this.selectedCourseId.set('');
    setTimeout(() => this.selectedCourseId.set(courseId), 0);
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
    this.courseForm.reset({
      title: '',
      subtitle: '',
      description: '',
      price: 99,
      category: 'Development',
      discountPrice: 0,
      discountStartDateUtc: '',
      discountEndDateUtc: '',
      requirements: '',
      outcomes: ''
    });
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
        this.courseForm.patchValue({
          title: details.title,
          subtitle: details.subtitle || '',
          description: details.description,
          price: details.price,
          category: details.category || 'Development',
          discountPrice: details.discountPrice || 0,
          discountStartDateUtc: details.discountStartDateUtc ? details.discountStartDateUtc.substring(0, 16) : '',
          discountEndDateUtc: details.discountEndDateUtc ? details.discountEndDateUtc.substring(0, 16) : '',
          requirements: details.requirements ? details.requirements.join('\n') : '',
          outcomes: details.outcomes ? details.outcomes.join('\n') : ''
        });
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
    const raw = this.courseForm.getRawValue();
    if (!raw.title.trim() || !raw.description.trim() || !raw.category.trim()) {
      this.formErrorMessage.set('Please fill in all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.formErrorMessage.set('');

    const baseDto: CreateCourseDto = {
      title: raw.title.trim(),
      subtitle: raw.subtitle ? raw.subtitle.trim() : '',
      description: raw.description.trim(),
      price: raw.price,
      category: raw.category.trim()
    };

    if (this.isEditingCourse()) {
      const requirementsList = raw.requirements ? raw.requirements.split('\n').map(r => r.trim()).filter(Boolean) : [];
      const outcomesList = raw.outcomes ? raw.outcomes.split('\n').map(o => o.trim()).filter(Boolean) : [];
      
      const updateDto: UpdateCourseDto = {
        ...baseDto,
        discountPrice: raw.discountPrice || 0,
        discountStartDateUtc: raw.discountStartDateUtc ? new Date(raw.discountStartDateUtc).toISOString() : undefined,
        discountEndDateUtc: raw.discountEndDateUtc ? new Date(raw.discountEndDateUtc).toISOString() : undefined,
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
    this.sectionForm.reset({
      title: '',
      order: (this.selectedCourseDetails()?.sections?.length || 0) + 1
    });
    this.formErrorMessage.set('');
    this.showSectionModal.set(true);
  }

  saveSection(): void {
    const raw = this.sectionForm.getRawValue();
    if (!raw.title.trim()) {
      this.formErrorMessage.set('Section title is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.studioService.createSection(this.selectedCourseId(), {
      title: raw.title.trim(),
      order: raw.order
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
    
    const section = this.selectedCourseDetails()?.sections?.find(s => s.id === sectionId);
    this.lessonForm.reset({
      title: '',
      description: '',
      durationInSeconds: 120,
      order: (section?.lessons?.length || 0) + 1,
      isPreview: false
    });
    
    this.selectedVideoFile = null;
    this.videoFileName.set('');
    this.formErrorMessage.set('');
    this.showLessonModal.set(true);
  }

  openEditLessonModal(lesson: LessonResponse, sectionId: string): void {
    this.isEditingLesson.set(true);
    this.editingLessonId.set(lesson.id);
    this.selectedSectionIdForLesson.set(sectionId);
    
    this.lessonForm.patchValue({
      title: lesson.title,
      description: lesson.description || '',
      durationInSeconds: lesson.durationInSeconds,
      order: lesson.order,
      isPreview: lesson.isPreview
    });
    
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
    const raw = this.lessonForm.getRawValue();
    if (!raw.title.trim()) {
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
      title: raw.title.trim(),
      description: raw.description ? raw.description.trim() : '',
      durationInSeconds: raw.durationInSeconds,
      order: raw.order,
      isPreview: raw.isPreview,
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

  getMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = 'https://localhost:7098';
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }
}
