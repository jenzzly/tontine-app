export type UserRole = 'admin' | 'management' | 'member';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  memberId?: string; // Link to member profile if user is a member
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
  outstandingBalance: number;
}

export type PaymentMethod = 'cash' | 'momo' | 'bank_transfer';

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  recordedBy: string;
  notes?: string;
  createdAt: Date;
}

export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'overdue';

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  status: LoanStatus;
  requestDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  dueDate: Date;
  remainingBalance: number;
  paidAmount: number;
  penalty: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  date: Date;
  recordedBy: string;
  notes?: string;
  createdAt: Date;
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

export interface ReportData {
  totalContributions: number;
  totalLoans: number;
  activeLoans: number;
  totalBalance: number;
  memberContributions: Array<{
    memberId: string;
    memberName: string;
    totalContributed: number;
  }>;
  loansSummary: {
    active: Loan[];
    completed: Loan[];
    overdue: Loan[];
  };
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
