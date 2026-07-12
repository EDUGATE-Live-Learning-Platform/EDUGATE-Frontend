import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WalletService } from '../../../infrastructure/services/wallet/wallet.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import { WalletResponse, WalletStatistics, TransactionDto, BillDto } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletComponent implements OnInit {
  walletService = inject(WalletService);
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);

  lang = this.layout.currentLang;
  t = this.translationService.translations;

  wallet = signal<WalletResponse | null>(null);
  statistics = signal<WalletStatistics | null>(null);
  transactions = signal<TransactionDto[]>([]);
  bills = signal<BillDto[]>([]);
  isLoading = signal<boolean>(false);

  latestBill = computed(() => this.bills().length > 0 ? this.bills()[0] : null);

  showDepositModal = signal<boolean>(false);
  showBillModal = signal<boolean>(false);
  depositAmount = signal<number>(0);
  isDepositing = signal<boolean>(false);

  billAmount = signal<number>(0);
  billDescription = signal<string>('Vodafone Cash recharge');
  billReference = signal<string>('');
  billFile = signal<File | null>(null);
  billFilePreview = signal<string | null>(null);
  isSubmittingBill = signal<boolean>(false);
  billSuccess = signal<string | null>(null);

  tabs: ('overview' | 'transactions' | 'deposit')[] = ['overview', 'transactions', 'deposit'];
  activeTab = signal<'overview' | 'transactions' | 'deposit'>('overview');

  // Selected Payment Method for Recharge form
  selectedPaymentMethod = signal<string>('vodafone');
  copySuccessMap = signal<{ [key: string]: boolean }>({});

  rechargeTransactions = computed(() => {
    // 1. Get all recharge transactions (Deposit, BillCrediting, Refund)
    const txs = this.transactions()
      .filter(tx => tx.type === 'Deposit' || tx.type === 'BillCrediting' || tx.type === 'Refund')
      .map(tx => ({
        id: tx.id.toString(),
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        description: tx.description || '',
        referenceNumber: tx.referenceNumber || '',
        createdAt: tx.createdAt,
        isBill: false,
        adminFeedback: undefined as string | undefined
      }));

    // 2. Get all pending or rejected bills
    const pendingOrRejectedBills = this.bills()
      .filter(b => b.status === 'Pending' || b.status === 'Rejected')
      .map(b => ({
        id: b.id,
        amount: b.amount,
        type: 'Recharge Request',
        status: b.status,
        description: b.description || 'Manual recharge request',
        referenceNumber: b.referenceNumber,
        createdAt: b.createdAt,
        isBill: true,
        adminFeedback: b.adminFeedback
      }));

    // 3. Merge and sort by date descending
    return [...pendingOrRejectedBills, ...txs].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  purchaseTransactions = computed(() => 
    this.transactions().filter(tx => 
      tx.type === 'Payment' || tx.type === 'CoursePurchase'
    )
  );

  // Filters and Pagination
  filterType = signal<string>('');
  filterStatus = signal<string>('');
  page = signal<number>(1);
  pageSize = 10;
  hasMoreTransactions = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);

  // Transaction Details Modal
  selectedTransaction = signal<any | null>(null);
  showDetailsModal = signal<boolean>(false);

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {
    this.isLoading.set(true);
    this.walletService.getWallet().subscribe({
      next: (res) => {
        this.wallet.set(res);
        this.loadStatistics();
        this.loadTransactions(false);
        this.loadUserBills();
      },
      error: () => {
        this.isLoading.set(false);
        this.wallet.set(null);
      }
    });
  }

  loadUserBills(): void {
    this.walletService.getUserBills().subscribe({
      next: (res) => this.bills.set(res),
      error: (err) => console.error('Failed to load user bills', err)
    });
  }

  loadStatistics(): void {
    this.walletService.getWalletStatistics().subscribe({
      next: (res) => {
        this.statistics.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadTransactions(append: boolean = false): void {
    if (!append) {
      this.page.set(1);
      this.hasMoreTransactions.set(true);
    }
    const currentPage = this.page();
    const typeVal = this.filterType() || undefined;
    const statusVal = this.filterStatus() || undefined;

    this.walletService.getTransactions(typeVal, statusVal, currentPage, this.pageSize).subscribe({
      next: (res) => {
        if (append) {
          this.transactions.update(prev => [...prev, ...res]);
        } else {
          this.transactions.set(res);
        }
        if (res.length < this.pageSize) {
          this.hasMoreTransactions.set(false);
        }
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoadingMore.set(false);
      }
    });
  }

  loadMoreTransactions(): void {
    if (this.isLoadingMore() || !this.hasMoreTransactions()) return;
    this.isLoadingMore.set(true);
    this.page.update(p => p + 1);
    this.loadTransactions(true);
  }

  onFilterChange(): void {
    this.loadTransactions(false);
  }

  openDepositModal(): void {
    this.depositAmount.set(0);
    this.showDepositModal.set(true);
  }

  closeDepositModal(): void {
    this.showDepositModal.set(false);
  }

  confirmDeposit(): void {
    if (this.isDepositing() || this.depositAmount() <= 0) return;
    this.isDepositing.set(true);
    this.walletService.deposit(this.depositAmount(), 'Direct simulation deposit').subscribe({
      next: () => {
        this.isDepositing.set(false);
        this.showDepositModal.set(false);
        this.loadWallet();
      },
      error: () => {
        this.isDepositing.set(false);
      }
    });
  }

  onPaymentMethodChange(method: string): void {
    this.selectedPaymentMethod.set(method);
    let desc = 'Manual recharge';
    if (method === 'vodafone') desc = 'Vodafone Cash recharge';
    else if (method === 'instapay') desc = 'Instapay recharge';
    else if (method === 'bank') desc = 'Bank transfer recharge';
    this.billDescription.set(desc);
  }

  copyToClipboard(text: string, key: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copySuccessMap.update(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          this.copySuccessMap.update(prev => ({ ...prev, [key]: false }));
        }, 2000);
      });
    }
  }

  onBillFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.billFile.set(file);

      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.billFilePreview.set(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        this.billFilePreview.set(null);
      }
    }
  }

  submitBill(): void {
    if (this.isSubmittingBill() || this.billAmount() <= 0 || !this.billFile()) return;
    this.isSubmittingBill.set(true);
    this.billSuccess.set(null);

    const formData = new FormData();
    formData.append('Amount', this.billAmount().toString());
    formData.append('Description', this.billDescription() || 'Vodafone cash recharge');
    formData.append('ReferenceNumber', this.billReference() || `BILL-${Date.now()}`);
    formData.append('BillImage', this.billFile()!);

    this.walletService.submitBill(formData).subscribe({
      next: () => {
        this.isSubmittingBill.set(false);
        this.billSuccess.set('Bill submitted successfully! Pending admin review.');
        this.showBillModal.set(false);
        this.billFile.set(null);
        this.billFilePreview.set(null);
        this.billAmount.set(0);
        this.billDescription.set('');
        this.billReference.set('');
        this.loadWallet();
      },
      error: () => {
        this.isSubmittingBill.set(false);
      }
    });
  }

  openBillModal(): void {
    this.showBillModal.set(true);
    this.billSuccess.set(null);
    this.billFilePreview.set(null);
  }

  closeBillModal(): void {
    this.showBillModal.set(false);
    this.billFilePreview.set(null);
  }

  viewTransactionDetails(tx: any): void {
    this.selectedTransaction.set(tx);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedTransaction.set(null);
  }

  setTab(tab: 'overview' | 'transactions' | 'deposit'): void {
    this.activeTab.set(tab);
  }

  getTransactionTypeIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'deposit': return 'arrow-down-circle';
      case 'payment': return 'arrow-up-circle';
      case 'refund': return 'refresh';
      case 'coursepurchase': return 'book';
      case 'billcrediting': return 'plus-circle';
      default: return 'circle';
    }
  }

  getTransactionStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed':
      case 'rejected': return 'text-red-400';
      default: return 'text-on-surface-variant';
    }
  }
}
