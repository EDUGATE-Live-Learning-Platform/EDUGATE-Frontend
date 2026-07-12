import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WalletService } from '../../../infrastructure/services/wallet/wallet.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import { WalletResponse, WalletStatistics, TransactionDto } from '../../../core/models/wallet.model';

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
  isLoading = signal<boolean>(false);

  showDepositModal = signal<boolean>(false);
  showBillModal = signal<boolean>(false);
  depositAmount = signal<number>(0);
  isDepositing = signal<boolean>(false);

  billAmount = signal<number>(0);
  billDescription = signal<string>('');
  billReference = signal<string>('');
  billFile = signal<File | null>(null);
  billFilePreview = signal<string | null>(null);
  isSubmittingBill = signal<boolean>(false);
  billSuccess = signal<string | null>(null);

  tabs: ('overview' | 'transactions' | 'deposit')[] = ['overview', 'transactions', 'deposit'];
  activeTab = signal<'overview' | 'transactions' | 'deposit'>('overview');

  // Filters and Pagination
  filterType = signal<string>('');
  filterStatus = signal<string>('');
  page = signal<number>(1);
  pageSize = 10;
  hasMoreTransactions = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);

  // Transaction Details Modal
  selectedTransaction = signal<TransactionDto | null>(null);
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
      },
      error: () => {
        this.isLoading.set(false);
        this.wallet.set(null);
      }
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

  viewTransactionDetails(tx: TransactionDto): void {
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
      case 'failed': return 'text-red-400';
      default: return 'text-on-surface-variant';
    }
  }
}
