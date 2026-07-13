import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalendarEvent } from '../../../core/models/course-catalog.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);

  getSystemStatistics(): Observable<any> {
    return this.http.get<any>('/api/v1/admin/dashboard/system-statistics');
  }

  getFinancialAudit(): Observable<any> {
    return this.http.get<any>('/api/v1/admin/dashboard/financial-audit');
  }

  getQueuesStatus(): Observable<any> {
    return this.http.get<any>('/api/v1/admin/dashboard/queues-status');
  }

  getPendingStudents(): Observable<any[]> {
    return this.http.get<any[]>('/api/admin/students/pending');
  }

  reviewStudent(userId: string, isApproved: boolean, feedback: string): Observable<any> {
    return this.http.post<any>('/api/admin/students/review', {
      UserId: userId,
      IsApproved: isApproved,
      Feedback: feedback
    });
  }

  getInstructorApplications(filters: {
    specialization?: string;
    governorate?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Observable<any> {
    let params = new HttpParams();
    if (filters.specialization) params = params.set('specialization', filters.specialization);
    if (filters.governorate) params = params.set('governorate', filters.governorate);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<any>('/api/v1/admin/instructor-applications', { params });
  }

  reviewInstructor(applicationId: string, status: string, reviewNotes: string): Observable<any> {
    return this.http.put<any>(`/api/v1/admin/instructor-applications/${applicationId}/status`, {
      Status: status,
      ReviewNotes: reviewNotes
    });
  }

  reviewBill(billId: string, isApproved: boolean, feedback: string): Observable<any> {
    return this.http.post<any>(`/api/admin/bills/${billId}/review`, {
      IsApproved: isApproved,
      Feedback: feedback
    });
  }

  createGlobalCalendarEvent(event: CalendarEvent): Observable<any> {
    return this.http.post<any>('/api/v1/admin/calendar', event);
  }

  // Helper to fetch pending manual recharge bills
  getPendingBills(): Observable<any[]> {
    return this.http.get<any[]>('/api/admin/bills/pending');
  }

  getUsers(filters: { role?: string; status?: string; search?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filters.role) params = params.set('role', filters.role);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<any[]>('/api/admin/users', { params });
  }

  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.http.put<any>(`/api/admin/users/${userId}/status`, { Status: status });
  }

  banUser(userId: string): Observable<any> {
    return this.http.post<any>(`/api/admin/users/${userId}/ban`, {});
  }

  unbanUser(userId: string): Observable<any> {
    return this.http.post<any>(`/api/admin/users/${userId}/unban`, {});
  }

  getWallets(): Observable<any[]> {
    return this.http.get<any[]>('/api/admin/wallets');
  }

  getTransactions(filters: { walletId?: string; userId?: string; type?: string; status?: string; from?: string; to?: string; page?: number; pageSize?: number }): Observable<any[]> {
    let params = new HttpParams();
    if (filters.walletId) params = params.set('walletId', filters.walletId);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    params = params.set('page', (filters.page || 1).toString());
    params = params.set('pageSize', (filters.pageSize || 50).toString());
    return this.http.get<any[]>('/api/admin/transactions', { params });
  }

  suspendWallet(walletId: string): Observable<any> {
    return this.http.post<any>(`/api/admin/wallets/${walletId}/suspend`, {});
  }

  unsuspendWallet(walletId: string): Observable<any> {
    return this.http.post<any>(`/api/admin/wallets/${walletId}/unsuspend`, {});
  }
}
