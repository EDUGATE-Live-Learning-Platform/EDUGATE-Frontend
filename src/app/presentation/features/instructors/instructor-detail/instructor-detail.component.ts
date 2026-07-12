import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InstructorService } from '../../../../infrastructure/services/instructor/instructor.service';
import { CourseService } from '../../../../infrastructure/services/course/course.service';
import { AppLayoutComponent } from '../../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../../core/services/translation.service';
import { InstructorProfile, InstructorListItem } from '../../../../core/models/instructor.model';
import { CourseCatalogItem } from '../../../../core/models/course-catalog.model';

@Component({
  selector: 'app-instructor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './instructor-detail.component.html',
  styleUrls: ['./instructor-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstructorDetailComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  instructorService = inject(InstructorService);
  courseService = inject(CourseService);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);

  private destroy$ = new Subject<void>();

  lang = this.layout.currentLang;
  t = this.translationService.translations;

  instructor = signal<InstructorListItem | null>(null);
  courses = signal<CourseCatalogItem[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadInstructor(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInstructor(id: string): void {
    this.isLoading.set(true);
    this.instructorService.getInstructorProfile(id).subscribe({
      next: (profile) => {
        this.instructor.set({
          instructorId: profile.instructorId,
          instructorName: profile.fullName,
          coursesCount: profile.activeCoursesCount,
          averageRating: profile.rating || 0,
          totalStudents: profile.studentCount || 0
        });
        this.loadCourses();
      },
      error: () => {
        this.isLoading.set(false);
        this.instructor.set(null);
      }
    });
  }

  loadCourses(): void {
    const inst = this.instructor();
    if (!inst) return;

    this.instructorService.getInstructorCourses(inst.instructorId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.courses.set(res);
      },
      error: () => {
        this.isLoading.set(false);
        this.courses.set([]);
      }
    });
  }

  viewCourse(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
  }

  goBack(): void {
    this.router.navigate(['/instructors']);
  }
}
