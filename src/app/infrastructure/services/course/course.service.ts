import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Course } from '../../../core/models/course.model';
import { CourseCatalogItem, CourseDetails, StudentDashboardResponse, CalendarEvent } from '../../../core/models/course-catalog.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private http = inject(HttpClient);

  private coursesState = signal<Course[]>([
    {
      id: 'angular-21-deep-dive',
      titleEn: 'Angular 21 & Clean Architecture',
      titleAr: 'أنغولار 21 وبنية البرمجيات النظيفة',
      descriptionEn: 'Master modern Angular 21, Signals, dependency injection, and clean architectural principles.',
      descriptionAr: 'احترف أنغولار 21، الإشارات، حقن التبعيات، ومبادئ البنية النظيفة.',
      instructor: 'Dr. Sarah Vance',
      progress: 65,
      category: 'Development',
      lessonsCount: 12,
      duration: '8.5 Hours',
      difficulty: 'Advanced',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400',
      xpReward: 120
    },
    {
      id: 'tailwind-high-fidelity',
      titleEn: 'Tailwind CSS Premium Aesthetics',
      titleAr: 'جماليات تصاميم Tailwind CSS الاحترافية',
      descriptionEn: 'Build high-fidelity user interfaces with glassmorphism, glowing states, and responsive layouts.',
      descriptionAr: 'ابنِ واجهات مستخدم عالية الدقة مع تأثيرات الزجاج والوهج المتألق وتصاميم متجاوبة.',
      instructor: 'Alex Rivera',
      progress: 85,
      category: 'Design',
      lessonsCount: 8,
      duration: '4.2 Hours',
      difficulty: 'Intermediate',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=400',
      xpReward: 80
    },
    {
      id: 'ai-prompt-engineering-code',
      titleEn: 'AI-Assisted Software Engineering',
      titleAr: 'هندسة البرمجيات بمساعدة الذكاء الاصطناعي',
      descriptionEn: 'Integrate LLMs, prompt templates, and code generation subagents in your developer workflow.',
      descriptionAr: 'ادمج النماذج اللغوية الكبيرة وقوالب التلقين ووكلاء التوليد البرمجي في مسار عملك المطور.',
      instructor: 'Aisha Al-Mansoor',
      progress: 20,
      category: 'AI & Engineering',
      lessonsCount: 15,
      duration: '12 Hours',
      difficulty: 'Advanced',
      image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=400',
      xpReward: 200
    }
  ]);

  // Read-only signal
  courses = computed(() => this.coursesState());

  incrementProgress(courseId: string): void {
    this.coursesState.update(courses => 
      courses.map(course => {
        if (course.id !== courseId) return course;
        if (course.progress >= 100) return course;

        // Increment progress by 15% (or to 100% max)
        const nextProgress = Math.min(course.progress + 15, 100);

        return { ...course, progress: nextProgress };
      })
    );
  }

  resetProgress(courseId: string): void {
    this.coursesState.update(courses =>
      courses.map(course => {
        if (course.id !== courseId) return course;
        return { ...course, progress: 0 };
      })
    );
  }

  // ----------------- HTTP Backend Catalog API Calls -----------------

  private getAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${environment.apiUrl}/${url.replace(/^\//, '')}`;
  }

  private mapCourseDetails(details: CourseDetails): CourseDetails {
    if (!details) return details;
    return {
      ...details,
      thumbnailUrl: this.getAbsoluteUrl(details.thumbnailUrl) || undefined,
      previewVideoUrl: this.getAbsoluteUrl(details.previewVideoUrl) || undefined,
      sections: details.sections ? details.sections.map(s => ({
        ...s,
        lessons: s.lessons ? s.lessons.map(l => ({
          ...l,
          videoUrl: this.getAbsoluteUrl(l.videoUrl) || undefined,
          attachments: l.attachments ? l.attachments.map(a => ({
            ...a,
            fileUrl: this.getAbsoluteUrl(a.fileUrl) || ''
          })) : []
        })) : []
      })) : []
    };
  }

  getCoursesCatalog(filters: {
    search?: string;
    category?: string;
    specialization?: string;
    maxPrice?: number;
    minRating?: number;
    page?: number;
    pageSize?: number;
  }): Observable<CourseCatalogItem[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.specialization) params = params.set('specialization', filters.specialization);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minRating !== undefined) params = params.set('minRating', filters.minRating.toString());
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.pageSize !== undefined) params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<CourseCatalogItem[]>('/api/v1/courses', { params }).pipe(
      map(courses => (courses || []).map(c => ({
        ...c,
        thumbnailUrl: this.getAbsoluteUrl(c.thumbnailUrl) || undefined
      })))
    );
  }

  getCourseDetails(courseId: string): Observable<CourseDetails> {
    return this.http.get<CourseDetails>(`/api/v1/courses/${courseId}`).pipe(
      map(details => this.mapCourseDetails(details))
    );
  }

  purchaseCourse(courseId: string): Observable<{ Message: string }> {
    return this.http.post<{ Message: string }>(`/api/v1/student/courses/${courseId}/purchase`, {});
  }

  getStudentDashboard(status?: string): Observable<StudentDashboardResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<StudentDashboardResponse[]>('/api/v1/student/dashboard', { params }).pipe(
      map(list => (list || []).map(c => ({
        ...c,
        thumbnailUrl: this.getAbsoluteUrl(c.thumbnailUrl) || undefined
      })))
    );
  }

  getStudentCourseContent(courseId: string): Observable<CourseDetails> {
    return this.http.get<CourseDetails>(`/api/v1/student/courses/${courseId}/content`).pipe(
      map(details => this.mapCourseDetails(details))
    );
  }

  getStudentDashboardSummary(): Observable<any> {
    return this.http.get('/api/v1/student/dashboard/summary');
  }

  getStudentCertificates(): Observable<any[]> {
    return this.http.get<any[]>('/api/v1/student/dashboard/certificates');
  }

  getCourseNotes(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/v1/student/courses/${courseId}/notes`);
  }

  saveNote(courseId: string, lessonId: string, noteText: string, timestampInSeconds: number): Observable<any> {
    return this.http.post(`/api/v1/student/courses/${courseId}/notes`, {
      LessonId: lessonId,
      NoteText: noteText,
      TimestampInSeconds: timestampInSeconds
    });
  }

  markLessonComplete(lessonId: string): Observable<any> {
    return this.http.post(`/api/v1/student/lessons/${lessonId}/complete`, {});
  }

  updateProgress(courseId: string, lessonId: string, second: number): Observable<any> {
    return this.http.post('/api/v1/student/courses/progress', {
      LessonId: lessonId,
      Seconds: second
    });
  }

  getCalendarEvents(): Observable<{ Data: CalendarEvent[] }> {
    return this.http.get<{ Data: CalendarEvent[] }>('/api/v1/student/calendar');
  }

  addCalendarEvent(event: CalendarEvent): Observable<{ Data: CalendarEvent }> {
    return this.http.post<{ Data: CalendarEvent }>('/api/v1/student/calendar', event);
  }

  getSignedAttachmentBlob(lessonId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`/api/v1/lessons/${lessonId}/attachments/${attachmentId}/download`, { responseType: 'blob' });
  }
}
