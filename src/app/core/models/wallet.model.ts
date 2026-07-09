export interface WalletResponse {
  walletId: number;
  balance: number;
  status: string;
  createdAt: string;
  lastTransactionAt: string;
}

export interface WalletStatistics {
  currentBalance: number;
  totalDeposits: number;
  totalPayments: number;
  totalRefunds: number;
  totalTransactions: number;
  latestTransactionDate: string;
}

export interface TransactionDto {
  id: number;
  amount: number;
  type: string;
  status: string;
  description?: string;
  referenceNumber?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PendingBillResponse {
  id: number;
  userId: number;
  userName: string;
  amount: number;
  description?: string;
  referenceNumber?: string;
  billImageUrl?: string;
  status: string;
  createdAt: string;
}

export interface DepositRequest {
  Amount: number;
  ReferenceNumber: string;
}

export interface SubmitBillRequest {
  Amount: number;
  Description: string;
  ReferenceNumber: string;
}

export interface ReviewBillRequest {
  IsApproved: boolean;
  Feedback: string;
}
