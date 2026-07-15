import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ActiveSessionDto {
  id: string;
  browser: string;
  os: string;
  ipAddress: string;
  country: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SecureMediaService {
  private http = inject(HttpClient);

  getSignedUrl(lessonId: string): Observable<string> {
    return this.http.get<{ data: { signedUrl: string } }>(`/api/v1/lessons/${lessonId}/video/sign`).pipe(
      map(res => res.data.signedUrl)
    );
  }

  getActiveSessions(): Observable<ActiveSessionDto[]> {
    return this.http.get<{ data: ActiveSessionDto[] }>('/api/v1/sessions/active').pipe(
      map(res => res.data || [])
    );
  }

  terminateSession(sessionId: string): Observable<any> {
    return this.http.post<any>(`/api/v1/sessions/${sessionId}/logout`, {});
  }

  terminateOtherSessions(): Observable<any> {
    return this.http.post<any>('/api/v1/sessions/logout-other', {});
  }
}
