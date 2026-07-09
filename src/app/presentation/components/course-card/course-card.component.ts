import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course } from '../../../core/models/course.model';
import { CourseService } from '../../../infrastructure/services/course/course.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseCardComponent {
  courseService = inject(CourseService);
  translationService = inject(TranslationService);

  t = this.translationService.translations;

  // Inputs using Angular signals API
  course = input.required<Course>();
  lang = input<'en' | 'ar'>('en');

  studyLesson(): void {
    this.courseService.incrementProgress(this.course().id);
  }

  resetProgress(): void {
    this.courseService.resetProgress(this.course().id);
  }
}
