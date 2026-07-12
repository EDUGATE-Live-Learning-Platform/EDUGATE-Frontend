import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InstructorService } from '../../../../infrastructure/services/instructor/instructor.service';
import { AppLayoutComponent } from '../../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../../core/services/translation.service';
import { InstructorListItem } from '../../../../core/models/instructor.model';

@Component({
  selector: 'app-instructor-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './instructor-list.component.html',
  styleUrls: ['./instructor-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstructorListComponent implements OnInit {
  instructorService = inject(InstructorService);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);
  router = inject(Router);

  lang = this.layout.currentLang;
  t = this.translationService.translations;

  instructors = signal<InstructorListItem[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading.set(true);
    this.instructorService.getAllInstructors().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.instructors.set(res);
      },
      error: () => {
        this.isLoading.set(false);
        this.instructors.set([]);
      }
    });
  }

  viewInstructor(id: string): void {
    this.router.navigate(['/instructors', id]);
  }
}
