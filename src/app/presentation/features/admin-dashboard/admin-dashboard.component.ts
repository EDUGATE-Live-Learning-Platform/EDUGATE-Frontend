import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AdminService } from '../../../infrastructure/services/admin/admin.service';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import { CalendarEvent } from '../../../core/models/course-catalog.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);
  router = inject(Router);
  sanitizer = inject(DomSanitizer);

  lang = this.layout.currentLang;
  t = this.translationService.translations;
  user = this.authService.currentUser;

  // Tabs state
  activeTab = signal<'stats' | 'students' | 'instructors' | 'wallet' | 'calendar' | 'users' | 'wallets'>('stats');
  isLoading = signal<boolean>(true);

  // Data signals
  stats = signal<any | null>(null);
  queues = signal<any | null>(null);
  auditResult = signal<any | null>(null);
  pendingStudents = signal<any[]>([]);
  instructorApplications = signal<any[]>([]);
  pendingBills = signal<any[]>([]);
  previewReceiptUrl = signal<string | null>(null);

  // Instructor filter signals
  instructorStatusFilter = signal<string>('');
  instructorSpecFilter = signal<string>('');
  instructorGovFilter = signal<string>('');

  // CV Viewer signals
  viewingCvUrl = signal<string | null>(null);
  getSafeCvUrl = computed(() => {
    const url = this.viewingCvUrl();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
  isPdfCv = computed(() => {
    const url = this.viewingCvUrl();
    if (!url) return false;
    return url.toLowerCase().includes('.pdf');
  });
  
  // Users signals
  usersList = signal<any[]>([]);
  usersSearchQuery = signal<string>('');
  usersRoleFilter = signal<string>('');
  usersStatusFilter = signal<string>('');
  isUpdatingUserStatus = signal<string>(''); // Stores userId currently being toggled

  // Wallets signals
  walletsList = signal<any[]>([]);
  walletsSearchQuery = signal<string>('');
  walletsStatusFilter = signal<string>('');
  walletsSortOrder = signal<'latest' | 'oldest' | 'balance_high' | 'balance_low'>('latest');
  selectedWallet = signal<any | null>(null);
  selectedWalletTransactions = signal<any[]>([]);
  isLoadingWalletTransactions = signal<boolean>(false);
  isTogglingWalletSuspension = signal<boolean>(false);

  // Bills date filter
  billsDateFrom = signal<string>('');
  billsDateTo = signal<string>('');
  billsSortOrder = signal<'latest' | 'oldest'>('latest');

  // Wallet modal transactions filters
  walletTxnsDateFrom = signal<string>('');
  walletTxnsDateTo = signal<string>('');
  walletTxnsTypeFilter = signal<string>('');
  walletTxnsSortOrder = signal<'latest' | 'oldest'>('latest');

  // Computed offline wallets filter
  filteredWallets = computed(() => {
    const query = this.walletsSearchQuery().toLowerCase().trim();
    const status = this.walletsStatusFilter();
    const sort = this.walletsSortOrder();
    let list = this.walletsList();

    list = list.filter(w => {
      const matchQuery = !query || 
        w.userFullName?.toLowerCase().includes(query) || 
        w.userEmail?.toLowerCase().includes(query) || 
        w.walletId?.toLowerCase().includes(query);
      const wStatus = String(w.status || w.Status || '');
      const matchStatus = !status || wStatus === status;
      return matchQuery && matchStatus;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || b.CreatedAt).getTime() - new Date(a.createdAt || a.CreatedAt).getTime();
      if (sort === 'oldest') return new Date(a.createdAt || a.CreatedAt).getTime() - new Date(b.createdAt || b.CreatedAt).getTime();
      if (sort === 'balance_high') return (b.balance || b.Balance || 0) - (a.balance || a.Balance || 0);
      if (sort === 'balance_low') return (a.balance || a.Balance || 0) - (b.balance || b.Balance || 0);
      return 0;
    });

    return list;
  });

  // Computed filtered + sorted bills
  filteredBills = computed(() => {
    const from = this.billsDateFrom();
    const to = this.billsDateTo();
    const sort = this.billsSortOrder();
    let list = this.pendingBills();

    if (from) {
      const fromDate = new Date(from);
      list = list.filter(b => new Date(b.createdAt || b.CreatedAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      list = list.filter(b => new Date(b.createdAt || b.CreatedAt) <= toDate);
    }

    list = [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.CreatedAt).getTime();
      const dateB = new Date(b.createdAt || b.CreatedAt).getTime();
      return sort === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return list;
  });

  // Action review modal signals
  showReviewModal = signal<boolean>(false);
  reviewTargetType = signal<'student' | 'instructor' | 'bill'>('student');
  reviewTargetId = signal<string>('');
  reviewStatus = signal<boolean>(true); // true = Approve, false = Reject
  feedbackText = signal<string>('');
  isSubmittingReview = signal<boolean>(false);
  reviewError = signal<string>('');

  // Calendar Event signals
  eventTitle = signal<string>('');
  eventDescription = signal<string>('');
  eventDate = signal<string>('');
  eventTime = signal<string>('10:00');
  eventType = signal<string>('Exam');
  isBroadcasting = signal<boolean>(false);
  broadcastSuccess = signal<string>('');
  broadcastError = signal<string>('');

  ngOnInit(): void {
    // Check if the user is an admin. If not, redirect
    const currentUser = this.user();
    if (currentUser && currentUser.Role !== 'Admin') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAdminData();
  }

  loadAdminData(): void {
    this.isLoading.set(true);

    // Fetch system statistics
    this.adminService.getSystemStatistics().subscribe({
      next: (res) => {
        this.stats.set(res);
      },
      error: (err) => console.error('Failed to load stats', err)
    });

    // Fetch queue counts
    this.adminService.getQueuesStatus().subscribe({
      next: (res) => {
        this.queues.set(res);
      },
      error: (err) => console.error('Failed to load queues', err)
    });

    // Fetch financial audit reports
    this.adminService.getFinancialAudit().subscribe({
      next: (res: any) => {
        if (res) {
          const totalWallets = res.WalletLedgerBalance || res.walletLedgerBalance || 0;
          const cashRegisters = (res.TotalDeposits || res.totalDeposits || 0) - (res.TotalWithdrawals || res.totalWithdrawals || 0);
          const discrepancy = totalWallets - cashRegisters;
          
          this.auditResult.set({
            TotalWalletsBalance: totalWallets,
            PlatformCashRegisters: cashRegisters,
            Discrepancy: discrepancy,
            IsBalanced: res.IsLedgerBalanced || res.isLedgerBalanced || false
          });
        } else {
          this.auditResult.set(null);
        }
      },
      error: (err) => {
        console.error('Failed to load financial audit', err);
        this.auditResult.set(null);
      }
    });

    // Fetch pending students list
    this.adminService.getPendingStudents().subscribe({
      next: (res) => {
        this.pendingStudents.set(res || []);
      },
      error: (err) => console.error('Failed to load pending students', err)
    });

    // Fetch instructor applications
    this.loadInstructorApplications();

    // Fetch pending manual recharge bills
    this.adminService.getPendingBills().subscribe({
      next: (res) => {
        this.pendingBills.set(res || []);
      },
      error: (err) => console.error('Failed to load bills', err)
    });

    // Fetch system users directory
    this.loadUsers();

    // Fetch user wallets audits
    this.loadWallets();
  }

  loadUsers(): void {
    this.adminService.getUsers({
      role: this.usersRoleFilter(),
      status: this.usersStatusFilter(),
      search: this.usersSearchQuery()
    }).subscribe({
      next: (res) => {
        this.usersList.set(res || []);
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  loadInstructorApplications(): void {
    this.adminService.getInstructorApplications({
      status: this.instructorStatusFilter(),
      specialization: this.instructorSpecFilter(),
      governorate: this.instructorGovFilter()
    }).subscribe({
      next: (res) => {
        const items = res?.Items || res?.items || res || [];
        this.instructorApplications.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load instructor applications', err);
        this.isLoading.set(false);
      }
    });
  }

  loadWallets(): void {
    this.adminService.getWallets().subscribe({
      next: (res) => {
        this.walletsList.set(res || []);
      },
      error: (err) => console.error('Failed to load wallets', err)
    });
  }

  toggleUserBan(userId: string, currentStatus: string | number): void {
    if (this.isUpdatingUserStatus()) return;

    this.isUpdatingUserStatus.set(userId);
    const isBanning = this.isUserActive(currentStatus);
    const request$ = isBanning
      ? this.adminService.banUser(userId)
      : this.adminService.unbanUser(userId);

    request$.subscribe({
      next: () => {
        this.isUpdatingUserStatus.set('');
        this.loadUsers(); // Refresh users list
        this.loadWallets(); // Refresh wallets ledger list
      },
      error: (err) => {
        this.isUpdatingUserStatus.set('');
        console.error('Failed to update user status', err);
      }
    });
  }

  openWalletDetails(wallet: any): void {
    this.selectedWallet.set(wallet);
    // Reset filters
    this.walletTxnsDateFrom.set('');
    this.walletTxnsDateTo.set('');
    this.walletTxnsTypeFilter.set('');
    this.walletTxnsSortOrder.set('latest');
    
    this.loadWalletTransactions();
  }

  loadWalletTransactions(): void {
    const wallet = this.selectedWallet();
    if (!wallet) return;

    this.isLoadingWalletTransactions.set(true);
    this.selectedWalletTransactions.set([]);

    this.adminService.getTransactions({
      walletId: wallet.walletId || wallet.id,
      type: this.walletTxnsTypeFilter() || undefined,
      from: this.walletTxnsDateFrom() || undefined,
      to: this.walletTxnsDateTo() || undefined,
      page: 1,
      pageSize: 100
    }).subscribe({
      next: (txns) => {
        let list = txns || [];
        const sort = this.walletTxnsSortOrder();
        list = [...list].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.CreatedAt).getTime();
          const dateB = new Date(b.createdAt || b.CreatedAt).getTime();
          return sort === 'latest' ? dateB - dateA : dateA - dateB;
        });

        this.selectedWalletTransactions.set(list);
        this.isLoadingWalletTransactions.set(false);
      },
      error: (err) => {
        console.error('Failed to load transactions for wallet', err);
        this.isLoadingWalletTransactions.set(false);
      }
    });
  }

  closeWalletDetails(): void {
    this.selectedWallet.set(null);
    this.selectedWalletTransactions.set([]);
  }

  toggleWalletSuspension(wallet: any): void {
    if (this.isTogglingWalletSuspension()) return;

    this.isTogglingWalletSuspension.set(true);
    const isSuspending = wallet.status === 'Active';
    const request$ = isSuspending
      ? this.adminService.suspendWallet(wallet.walletId || wallet.id)
      : this.adminService.unsuspendWallet(wallet.walletId || wallet.id);

    request$.subscribe({
      next: () => {
        this.isTogglingWalletSuspension.set(false);
        // Toggle local status instantly to update UI
        const updatedWallet = { ...wallet, status: isSuspending ? 'Suspended' : 'Active' };
        this.selectedWallet.set(updatedWallet);
        this.loadWallets(); // Refresh main list
      },
      error: (err) => {
        this.isTogglingWalletSuspension.set(false);
        console.error('Failed to toggle wallet suspension', err);
      }
    });
  }

  setTab(tab: 'stats' | 'students' | 'instructors' | 'wallet' | 'calendar' | 'users' | 'wallets'): void {
    this.activeTab.set(tab);
  }

  // Review Operations
  openReviewModal(targetType: 'student' | 'instructor' | 'bill', id: string, approve: boolean): void {
    this.reviewTargetType.set(targetType);
    this.reviewTargetId.set(id);
    this.reviewStatus.set(approve);
    this.feedbackText.set('');
    this.reviewError.set('');
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
  }

  submitReview(): void {
    const id = this.reviewTargetId();
    const isApprove = this.reviewStatus();
    const feedback = this.feedbackText().trim() || 'Review decision processed.';

    this.isSubmittingReview.set(true);
    this.reviewError.set('');

    if (this.reviewTargetType() === 'student') {
      this.adminService.reviewStudent(id, isApprove, feedback).subscribe({
        next: () => {
          this.isSubmittingReview.set(false);
          this.showReviewModal.set(false);
          this.loadAdminData(); // Refresh list
        },
        error: (err) => {
          this.isSubmittingReview.set(false);
          this.reviewError.set(err.error?.Message || 'Failed to submit student review.');
        }
      });
    } else if (this.reviewTargetType() === 'instructor') {
      const status = isApprove ? 'Approved' : 'Rejected';
      this.adminService.reviewInstructor(id, status, feedback).subscribe({
        next: () => {
          this.isSubmittingReview.set(false);
          this.showReviewModal.set(false);
          this.loadAdminData();
        },
        error: (err) => {
          this.isSubmittingReview.set(false);
          this.reviewError.set(err.error?.Message || 'Failed to submit instructor review.');
        }
      });
    } else if (this.reviewTargetType() === 'bill') {
      this.adminService.reviewBill(id, isApprove, feedback).subscribe({
        next: () => {
          this.isSubmittingReview.set(false);
          this.showReviewModal.set(false);
          this.loadAdminData();
        },
        error: (err) => {
          this.isSubmittingReview.set(false);
          this.reviewError.set(err.error?.Message || 'Failed to submit bill review.');
        }
      });
    }
  }

  getRoleLabel(role: string | number): string {
    const r = String(role).trim().toLowerCase();
    if (r === 'admin' || r === '0') return this.lang() === 'ar' ? 'مسؤول النظام' : 'Admin';
    if (r === 'instructor' || r === '1') return this.lang() === 'ar' ? 'معلم' : 'Instructor';
    if (r === 'student' || r === '2') return this.lang() === 'ar' ? 'طالب' : 'Student';
    return String(role);
  }

  getStatusLabel(status: string | number): string {
    const s = String(status).trim().toLowerCase();
    if (s === 'active' || s === '1') return this.lang() === 'ar' ? 'نشط' : 'Active';
    if (s === 'inactive' || s === '3') return this.lang() === 'ar' ? 'محظور' : 'Banned';
    if (s === 'pendingapproval' || s === '0') return this.lang() === 'ar' ? 'معلق' : 'Pending';
    if (s === 'rejected' || s === '2') return this.lang() === 'ar' ? 'مرفوض' : 'Rejected';
    return String(status);
  }

  isUserActive(status: string | number): boolean {
    const s = String(status).trim().toLowerCase();
    return s === 'active' || s === '1';
  }

  getReceiptUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Relative path — prepend API base URL
    const base = 'https://localhost:7098';
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }

  // Calendar Event Broadcast
  submitBroadcastEvent(): void {
    if (!this.eventTitle().trim()) {
      this.broadcastError.set(this.lang() === 'ar' ? 'عنوان الحدث مطلوب.' : 'Event title is required.');
      return;
    }
    if (!this.eventDate()) {
      this.broadcastError.set(this.lang() === 'ar' ? 'تاريخ الحدث مطلوب.' : 'Event date is required.');
      return;
    }

    this.isBroadcasting.set(true);
    this.broadcastError.set('');
    this.broadcastSuccess.set('');

    const time = this.eventTime() || '00:00';
    const combinedDate = new Date(`${this.eventDate()}T${time}:00`).toISOString();

    const eventPayload: CalendarEvent = {
      title: this.eventTitle(),
      description: this.eventDescription(),
      eventDate: combinedDate,
      eventType: this.eventType()
    };

    this.adminService.createGlobalCalendarEvent(eventPayload).subscribe({
      next: () => {
        this.isBroadcasting.set(false);
        this.broadcastSuccess.set(this.lang() === 'ar' ? 'تم نشر الحدث العام بنجاح لجميع الطلاب.' : 'Global event broadcasted successfully to all students.');
        // Reset form
        this.eventTitle.set('');
        this.eventDescription.set('');
        this.eventDate.set('');
        this.eventType.set('Exam');
      },
      error: (err) => {
        this.isBroadcasting.set(false);
        this.broadcastError.set(err.error?.Message || 'Failed to broadcast event.');
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(this.lang() === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
