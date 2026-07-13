import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateCourseDto,
  UpdateCourseDto,
  InstructorDashboardSummary,
  InstructorCourseReportItem,
  InstructorReviewFeedItem,
  InstructorProfileView,
  CreateSectionDto
} from '../../../core/models/instructor-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class InstructorStudioService {
  private http = inject(HttpClient);

  // ----------------- Dashboard Data -----------------
  
  getDashboardSummary(): Observable<InstructorDashboardSummary> {
    return this.http.get<InstructorDashboardSummary>('/api/v1/instructor/dashboard/summary');
  }

  getCoursesReport(): Observable<InstructorCourseReportItem[]> {
    return this.http.get<InstructorCourseReportItem[]>('/api/v1/instructor/dashboard/courses-report');
  }

  getRecentReviews(): Observable<InstructorReviewFeedItem[]> {
    return this.http.get<InstructorReviewFeedItem[]>('/api/v1/instructor/dashboard/recent-reviews');
  }

  getInstructorProfile(): Observable<InstructorProfileView> {
    return this.http.get<InstructorProfileView>('/api/v1/instructor/profile');
  }

  // ----------------- Course Lifecycle -----------------

  createCourse(dto: CreateCourseDto): Observable<any> {
    return this.http.post<any>('/api/v1/courses', dto);
  }

  updateCourse(courseId: string, dto: UpdateCourseDto): Observable<any> {
    return this.http.put<any>(`/api/v1/courses/${courseId}`, dto);
  }

  uploadCourseMedia(courseId: string, thumbnailFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', thumbnailFile);
    return this.http.post<any>(`/api/v1/courses/${courseId}/media`, formData);
  }

  publishCourse(courseId: string): Observable<any> {
    return this.http.put<any>(`/api/v1/courses/${courseId}/publish`, {});
  }

  unpublishCourse(courseId: string): Observable<any> {
    return this.http.put<any>(`/api/v1/courses/${courseId}/unpublish`, {});
  }

  // ----------------- Sections & Curriculum -----------------

  createSection(courseId: string, dto: CreateSectionDto): Observable<any> {
    return this.http.post<any>(`/api/v1/courses/${courseId}/sections`, dto);
  }

  // ----------------- Lessons & Attachments -----------------

  createLesson(sectionId: string, data: {
    title: string;
    description: string;
    durationInSeconds: number;
    order: number;
    isPreview: boolean;
    videoFile?: File;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('durationInSeconds', data.durationInSeconds.toString());
    formData.append('order', data.order.toString());
    formData.append('isPreview', data.isPreview.toString());
    if (data.videoFile) {
      formData.append('videoFile', data.videoFile);
    }
    return this.http.post<any>(`/api/v1/courses/sections/${sectionId}/lessons`, formData);
  }

  updateLesson(lessonId: string, data: {
    title: string;
    description: string;
    durationInSeconds: number;
    order: number;
    isPreview: boolean;
    videoFile?: File;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('durationInSeconds', data.durationInSeconds.toString());
    formData.append('order', data.order.toString());
    formData.append('isPreview', data.isPreview.toString());
    if (data.videoFile) {
      formData.append('videoFile', data.videoFile);
    }
    return this.http.put<any>(`/api/v1/courses/lessons/${lessonId}`, formData);
  }

  deleteLesson(lessonId: string): Observable<any> {
    return this.http.delete<any>(`/api/v1/courses/lessons/${lessonId}`);
  }

  uploadLessonAttachment(lessonId: string, attachmentFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('attachmentFile', attachmentFile);
    return this.http.post<any>(`/api/v1/courses/lessons/${lessonId}/attachments`, formData);
  }
}
