import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseCardComponent } from '../../components/course-card/course-card.component';
import { CourseService } from '../../../infrastructure/services/course/course.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CourseCardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  // Inject services and parent layout for lang
  courseService = inject(CourseService);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);

  // Expose signals to template
  courses = this.courseService.courses;
  lang = this.layout.currentLang;
  t = this.translationService.translations;
}
