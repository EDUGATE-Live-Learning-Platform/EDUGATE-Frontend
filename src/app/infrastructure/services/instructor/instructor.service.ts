import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InstructorProfile, InstructorListItem } from '../../../core/models/instructor.model';
import { CourseCatalogItem } from '../../../core/models/course-catalog.model';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private http = inject(HttpClient);

  getInstructorProfile(instructorId?: string): Observable<InstructorProfile> {
    if (instructorId) {
      return this.http.get<InstructorProfile>(`/api/v1/instructors/${instructorId}/profile`);
    }
    return this.http.get<InstructorProfile>('/api/v1/instructor/profile');
  }

  getAllInstructors(): Observable<InstructorListItem[]> {
    return this.http.get<CourseCatalogItem[]>('/api/v1/courses', {
      params: new HttpParams().set('pageSize', '100')
    }).pipe(
      map(courses => {
        const map = new Map<string, { name: string; count: number; totalRating: number; coursesWithRating: number }>();
        courses.forEach(c => {
          const id = c.instructorId;
          if (!id) return;
          if (!map.has(id)) {
            map.set(id, { name: c.instructorName, count: 0, totalRating: 0, coursesWithRating: 0 });
          }
          const entry = map.get(id)!;
          entry.count++;
          if (c.averageRating > 0) {
            entry.totalRating += c.averageRating;
            entry.coursesWithRating++;
          }
        });
        return Array.from(map.entries()).map(([id, data]) => ({
          instructorId: id,
          instructorName: data.name,
          coursesCount: data.count,
          averageRating: data.coursesWithRating > 0 ? data.totalRating / data.coursesWithRating : 0,
          totalStudents: 0
        } as InstructorListItem));
      })
    );
  }

  getInstructorCourses(instructorId: string): Observable<CourseCatalogItem[]> {
    return this.http.get<CourseCatalogItem[]>('/api/v1/courses', {
      params: new HttpParams()
        .set('pageSize', '50')
        .set('instructorId', instructorId)
    });
  }

  submitInstructorApplication(formData: FormData): Observable<any> {
    return this.http.post<any>('/api/v1/instructor-applications', formData);
  }
}
