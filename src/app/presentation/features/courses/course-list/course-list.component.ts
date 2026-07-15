import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CourseService } from '../../../../infrastructure/services/course/course.service';
import { TranslationService, TranslationSchema } from '../../../../core/services/translation.service';
import { AppLayoutComponent } from '../../../layouts/app-layout/app-layout.component';
import { CourseCatalogItem } from '../../../../core/models/course-catalog.model';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseListComponent implements OnInit, OnDestroy {
  courseService = inject(CourseService);
  translationService = inject(TranslationService);
  layout = inject(AppLayoutComponent);
  router = inject(Router);

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Expose signals to template
  lang = this.layout.currentLang;
  t = this.translationService.translations;

  // Filter signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  maxPrice = signal<number>(2500);
  minRating = signal<number>(0);
  
  // Pagination signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  // Data signals
  courses = signal<CourseCatalogItem[]>([]);
  isLoading = signal<boolean>(false);
  hasMore = signal<boolean>(false);

  // Available categories with translation keys
  categories = [
    { value: '', labelKey: 'catalog.allCategories' },
    { value: 'Computer Science', labelKey: 'catalog.catCS' },
    { value: 'Artificial Intelligence', labelKey: 'catalog.catAI' },
    { value: 'Mathematics', labelKey: 'catalog.catMath' },
    { value: 'Development', labelKey: 'catalog.catDev' },
    { value: 'Physics', labelKey: 'catalog.catPhysics' },
    { value: 'Chemistry', labelKey: 'catalog.catChemistry' },
    { value: 'Design', labelKey: 'catalog.catDesign' },
    { value: 'Cybersecurity', labelKey: 'catalog.catCyber' },
    { value: 'Software Engineering', labelKey: 'catalog.catSE' }
  ];

  translateKey(key: string): string {
    if (key.startsWith('catalog.')) {
      const subKey = key.split('.')[1] as keyof TranslationSchema['catalog'];
      return this.t().catalog[subKey] || '';
    }
    return '';
  }

  constructor() {}

  ngOnInit(): void {
    // Debounce search input to avoid spamming the backend
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(val => {
      this.searchQuery.set(val);
      this.resetAndLoad();
    });

    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat);
    this.resetAndLoad();
  }

  onPriceChange(price: number): void {
    this.maxPrice.set(price);
    this.resetAndLoad();
  }

  onRatingChange(rating: number): void {
    this.minRating.set(rating);
    this.resetAndLoad();
  }

  resetAndLoad(): void {
    this.currentPage.set(1);
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading.set(true);

    const filters = {
      search: this.searchQuery(),
      category: this.selectedCategory() || undefined,
      maxPrice: this.maxPrice(),
      minRating: this.minRating() || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.courseService.getCoursesCatalog(filters).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.courses.set(res);
        // If we fetched a full page, assume there might be more
        this.hasMore.set(res.length === this.pageSize());
      },
      error: () => {
        this.isLoading.set(false);
        this.courses.set([]);
        this.hasMore.set(false);
      }
    });
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadCourses();
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.currentPage.update(p => p + 1);
      this.loadCourses();
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.maxPrice.set(2500);
    this.minRating.set(0);
    this.currentPage.set(1);
    this.loadCourses();
  }

  viewDetails(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
  }
}
