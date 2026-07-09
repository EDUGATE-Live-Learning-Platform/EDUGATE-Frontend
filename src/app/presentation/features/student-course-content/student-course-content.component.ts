import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CourseService } from '../../../infrastructure/services/course/course.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import { CourseDetails, SectionResponse, LessonResponse } from '../../../core/models/course-catalog.model';

@Component({
  selector: 'app-student-course-content',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-course-content.component.html',
  styleUrls: ['./student-course-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentCourseContentComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  courseService = inject(CourseService);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);

  private destroy$ = new Subject<void>();

  lang = this.layout.currentLang;
  t = this.translationService.translations;

  course = signal<CourseDetails | null>(null);
  isLoading = signal<boolean>(false);

  activeLesson = signal<LessonResponse | null>(null);
  activeSectionId = signal<string | null>(null);
  collapsedSections = signal<Record<string, boolean>>({});

  noteText = signal<string>('');
  notes = signal<any[]>([]);
  showNotes = signal<boolean>(false);
  isSavingNote = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('courseId');
      if (id) {
        this.loadCourseContent(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourseContent(courseId: string): void {
    this.isLoading.set(true);
    this.courseService.getStudentCourseContent(courseId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.course.set(res);

        const collapseMap: Record<string, boolean> = {};
        res.sections.forEach((s, idx) => {
          collapseMap[s.id] = idx > 0;
        });
        this.collapsedSections.set(collapseMap);

        const firstLesson = res.sections[0]?.lessons[0];
        if (firstLesson) {
          this.activeLesson.set(firstLesson);
          this.activeSectionId.set(res.sections[0].id);
        }

        this.loadNotes(courseId);
      },
      error: () => {
        this.isLoading.set(false);
        this.course.set(null);
      }
    });
  }

  loadNotes(courseId: string): void {
    this.courseService.getCourseNotes(courseId).subscribe({
      next: (res) => this.notes.set(res),
      error: () => this.notes.set([])
    });
  }

  toggleSection(sectionId: string): void {
    this.collapsedSections.update(s => ({ ...s, [sectionId]: !s[sectionId] }));
  }

  selectLesson(lesson: LessonResponse, sectionId: string): void {
    this.activeLesson.set(lesson);
    this.activeSectionId.set(sectionId);
  }

  markAsComplete(lessonId: string): void {
    this.courseService.markLessonComplete(lessonId).subscribe({
      next: () => {
        const course = this.course();
        if (!course) return;
        const updated = {
          ...course,
          sections: course.sections.map(s => ({
            ...s,
            lessons: s.lessons.map(l =>
              l.id === lessonId ? { ...l, isCompleted: true } : l
            )
          }))
        };
        this.course.set(updated);
      }
    });
  }

  saveNote(): void {
    const lesson = this.activeLesson();
    const course = this.course();
    if (!lesson || !course || !this.noteText().trim()) return;

    this.isSavingNote.set(true);
    this.courseService.saveNote(course.id, lesson.id, this.noteText(), 0).subscribe({
      next: () => {
        this.isSavingNote.set(false);
        this.noteText.set('');
        this.loadNotes(course.id);
      },
      error: () => this.isSavingNote.set(false)
    });
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  goBack(): void {
    const course = this.course();
    if (course) {
      this.router.navigate(['/courses', course.id]);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  getCompletedCount(): number {
    const course = this.course();
    if (!course) return 0;
    return course.sections.reduce((acc, s) =>
      acc + s.lessons.filter(l => l.isCompleted).length, 0);
  }

  getTotalLessons(): number {
    const course = this.course();
    if (!course) return 0;
    return course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  }
}
