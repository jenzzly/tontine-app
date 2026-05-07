export type UserRole = 'admin' | 'management' | 'member';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Member {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  joinedDate: Date;
  isActive: boolean;
  totalContributed: number;
  totalBorrowed: number;
  loanBalance: number;
}

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentMethod: 'cash' | 'momo' | 'bank_transfer';
  date: Date;
  recordedBy: string;
  notes?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'overdue';
  requestDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  dueDate: Date;
  remainingBalance: number;
  paidAmount: number;
  penalty: number;
  notes?: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  date: Date;
  recordedBy: string;
  notes?: string;
}

export interface TontineSummary {
  totalMembers: number;
  activeMembers: number;
  totalContributions: number;
  totalLoans: number;
  activeLoans: number;
  totalLoanBalance: number;
  availableBalance: number;
  overdueLoans: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'contribution' | 'loan' | 'reminder' | 'system';
  isRead: boolean;
  createdAt: Date;
  userId?: string;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  memberId?: string;
  status?: string;
}
