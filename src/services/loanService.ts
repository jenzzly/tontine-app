import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  getDocs,
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { Loan, LoanRepayment } from '@/types';

const LOANS_COLLECTION = 'loans';
const REPAYMENTS_COLLECTION = 'loan_repayments';

// Penalty rate per month (5%)
const PENALTY_RATE = 0.05;

export const loanService = {
  // Create a loan request
  async createLoanRequest(loanData: Omit<Loan, 'id' | 'status' | 'approvedDate' | 'approvedBy' | 'paidAmount' | 'penalty'>) {
    try {
      const docRef = doc(collection(db, LOANS_COLLECTION));
      const loan: Omit<Loan, 'id' | 'approvedDate' | 'approvedBy' | 'paidAmount' | 'penalty'> = {
        ...loanData,
        status: 'pending',
        paidAmount: 0,
        penalty: 0,
        remainingBalance: loanData.totalRepayment,
      };

      await setDoc(docRef, {
        ...loan,
        requestDate: Timestamp.fromDate(loanData.requestDate),
        dueDate: Timestamp.fromDate(loanData.dueDate),
        createdAt: serverTimestamp(),
      });

      return { id: docRef.id, ...loan };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create loan request');
    }
  },

  // Get all loans
  async getAllLoans() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, LOANS_COLLECTION), orderBy('requestDate', 'desc'))
      );
      const loans: Loan[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loans.push({
          ...data,
          id: doc.id,
          requestDate: data.requestDate?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
          approvedDate: data.approvedDate?.toDate(),
        } as Loan);
      });

      return loans;
    } catch (error) {
      console.error('Error getting loans:', error);
      return [];
    }
  },

  // Get loans by member ID
  async getLoansByMember(memberId: string) {
    try {
      const q = query(
        collection(db, LOANS_COLLECTION),
        where('memberId', '==', memberId),
        orderBy('requestDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const loans: Loan[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loans.push({
          ...data,
          id: doc.id,
          requestDate: data.requestDate?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
          approvedDate: data.approvedDate?.toDate(),
        } as Loan);
      });

      return loans;
    } catch (error) {
      console.error('Error getting member loans:', error);
      return [];
    }
  },

  // Get pending loans (for approval)
  async getPendingLoans() {
    try {
      const q = query(
        collection(db, LOANS_COLLECTION),
        where('status', '==', 'pending'),
        orderBy('requestDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const loans: Loan[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loans.push({
          ...data,
          id: doc.id,
          requestDate: data.requestDate?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
        } as Loan);
      });

      return loans;
    } catch (error) {
      console.error('Error getting pending loans:', error);
      return [];
    }
  },

  // Get active loans
  async getActiveLoans() {
    try {
      const allLoans = await this.getAllLoans();
      return allLoans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
    } catch (error) {
      console.error('Error getting active loans:', error);
      return [];
    }
  },

  // Get overdue loans
  async getOverdueLoans() {
    try {
      const allLoans = await this.getAllLoans();
      const today = new Date();
      return allLoans.filter(loan => 
        (loan.status === 'active' || loan.status === 'overdue') && 
        loan.dueDate < today && 
        loan.remainingBalance > 0
      );
    } catch (error) {
      console.error('Error getting overdue loans:', error);
      return [];
    }
  },

  // Approve a loan
  async approveLoan(loanId: string, approvedBy: string) {
    try {
      const loanRef = doc(db, LOANS_COLLECTION, loanId);
      const loanDoc = await getDoc(loanRef);
      
      if (!loanDoc.exists()) {
        throw new Error('Loan not found');
      }

      const data = loanDoc.data();
      if (data.status !== 'pending') {
        throw new Error('Loan is not pending approval');
      }

      await updateDoc(loanRef, {
        status: 'active',
        approvedBy,
        approvedDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to approve loan');
    }
  },

  // Reject a loan
  async rejectLoan(loanId: string, reason?: string) {
    try {
      await updateDoc(doc(db, LOANS_COLLECTION, loanId), {
        status: 'rejected',
        notes: reason || 'Loan rejected',
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reject loan');
    }
  },

  // Record a loan repayment
  async recordRepayment(repaymentData: Omit<LoanRepayment, 'id' | 'date'>) {
    try {
      const docRef = doc(collection(db, REPAYMENTS_COLLECTION));
      const repayment: Omit<LoanRepayment, 'id'> = {
        ...repaymentData,
        date: new Date(),
      };

      await setDoc(docRef, {
        ...repayment,
        date: Timestamp.fromDate(repayment.date),
        createdAt: serverTimestamp(),
      });

      // Update loan balance
      const loanRef = doc(db, LOANS_COLLECTION, repaymentData.loanId);
      const loanDoc = await getDoc(loanRef);
      
      if (loanDoc.exists()) {
        const data = loanDoc.data();
        const newRemainingBalance = Math.max(0, data.remainingBalance - repaymentData.amount);
        const newPaidAmount = (data.paidAmount || 0) + repaymentData.amount;
        
        let newStatus = data.status;
        if (newRemainingBalance <= 0) {
          newStatus = 'completed';
        } else if (newStatus === 'overdue') {
          newStatus = 'active';
        }

        await updateDoc(loanRef, {
          remainingBalance: newRemainingBalance,
          paidAmount: newPaidAmount,
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      }

      return { id: docRef.id, ...repayment };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to record repayment');
    }
  },

  // Calculate and apply penalty for overdue loan
  async calculatePenalty(loanId: string) {
    try {
      const loanRef = doc(db, LOANS_COLLECTION, loanId);
      const loanDoc = await getDoc(loanRef);
      
      if (!loanDoc.exists()) {
        throw new Error('Loan not found');
      }

      const data = loanDoc.data();
      const dueDate = data.dueDate?.toDate() || new Date();
      const today = new Date();

      if (today > dueDate && data.remainingBalance > 0) {
        const monthsOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const penalty = data.remainingBalance * PENALTY_RATE * monthsOverdue;

        await updateDoc(loanRef, {
          status: 'overdue',
          penalty,
          updatedAt: serverTimestamp(),
        });

        return penalty;
      }

      return 0;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to calculate penalty');
    }
  },

  // Update all overdue loans penalties
  async updateAllOverduePenalties() {
    try {
      const overdueLoans = await this.getOverdueLoans();
      const results = await Promise.all(
        overdueLoans.map(loan => this.calculatePenalty(loan.id))
      );
      return results;
    } catch (error) {
      console.error('Error updating penalties:', error);
      return [];
    }
  },

  // Get loan by ID
  async getLoanById(loanId: string) {
    try {
      const loanDoc = await getDoc(doc(db, LOANS_COLLECTION, loanId));
      
      if (!loanDoc.exists()) {
        return null;
      }

      const data = loanDoc.data();
      return {
        ...data,
        id: loanDoc.id,
        requestDate: data.requestDate?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate() || new Date(),
        approvedDate: data.approvedDate?.toDate(),
      } as Loan;
    } catch (error) {
      console.error('Error getting loan:', error);
      return null;
    }
  },

  // Get repayments for a loan
  async getRepaymentsByLoan(loanId: string) {
    try {
      const q = query(
        collection(db, REPAYMENTS_COLLECTION),
        where('loanId', '==', loanId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const repayments: LoanRepayment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        repayments.push({
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(),
        } as LoanRepayment);
      });

      return repayments;
    } catch (error) {
      console.error('Error getting repayments:', error);
      return [];
    }
  },

  // Get total outstanding loans
  async getTotalOutstandingLoans() {
    try {
      const loans = await this.getActiveLoans();
      return loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
    } catch (error) {
      console.error('Error getting total outstanding loans:', error);
      return 0;
    }
  },

  // Get loans summary for reports
  async getLoansSummary() {
    try {
      const allLoans = await this.getAllLoans();
      
      const summary = {
        total: allLoans.length,
        pending: allLoans.filter(l => l.status === 'pending').length,
        active: allLoans.filter(l => l.status === 'active').length,
        completed: allLoans.filter(l => l.status === 'completed').length,
        rejected: allLoans.filter(l => l.status === 'rejected').length,
        overdue: allLoans.filter(l => l.status === 'overdue').length,
        totalAmount: allLoans.reduce((sum, l) => sum + l.amount, 0),
        totalRepaid: allLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0),
        totalRemaining: allLoans.reduce((sum, l) => sum + l.remainingBalance, 0),
        totalPenalties: allLoans.reduce((sum, l) => sum + (l.penalty || 0), 0),
      };

      return summary;
    } catch (error) {
      console.error('Error getting loans summary:', error);
      return {
        total: 0, pending: 0, active: 0, completed: 0, rejected: 0, overdue: 0,
        totalAmount: 0, totalRepaid: 0, totalRemaining: 0, totalPenalties: 0,
      };
    }
  },

  // Delete a loan (admin only, only for rejected or completed loans)
  async deleteLoan(loanId: string) {
    try {
      const loan = await this.getLoanById(loanId);
      
      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status === 'active' || loan.status === 'pending') {
        throw new Error('Cannot delete active or pending loans');
      }

      await deleteDoc(doc(db, LOANS_COLLECTION, loanId));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete loan');
    }
  },
};
