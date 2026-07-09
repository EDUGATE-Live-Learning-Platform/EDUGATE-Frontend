import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WalletResponse, WalletStatistics, TransactionDto, PendingBillResponse } from '../../../core/models/wallet.model';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);

  balance = signal<number>(0);
  walletData = signal<WalletResponse | null>(null);

  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>('/api/wallet').pipe(
      tap(res => {
        this.balance.set(res.balance);
        this.walletData.set(res);
      })
    );
  }

  getBalance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>('/api/wallet/balance').pipe(
      tap(res => this.balance.set(res.balance))
    );
  }

  getWalletStatistics(): Observable<WalletStatistics> {
    return this.http.get<WalletStatistics>('/api/wallet/statistics');
  }

  deposit(amount: number): Observable<{ Message: string }> {
    const ref = `SIM-DEP-${Math.floor(100000 + Math.random() * 900000)}`;
    return this.http.post<{ Message: string }>('/api/wallet/deposit', {
      Amount: amount,
      ReferenceNumber: ref
    }).pipe(
      tap(() => {
        this.getWallet().subscribe();
      })
    );
  }

  getTransactions(type?: string, status?: string, page?: number, pageSize?: number): Observable<TransactionDto[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    if (page) params = params.set('page', page.toString());
    if (pageSize) params = params.set('pageSize', pageSize.toString());
    return this.http.get<TransactionDto[]>('/api/transactions', { params });
  }

  getTransaction(id: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(`/api/transactions/${id}`);
  }

  submitBill(formData: FormData): Observable<{ Message: string }> {
    return this.http.post<{ Message: string }>('/api/bills/submit', formData);
  }
}
