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
  increment
} from 'firebase/firestore';
import { Contribution, PaymentMethod } from '@/types';

const CONTRIBUTIONS_COLLECTION = 'contributions';

export const contributionService = {
  // Record a new contribution
  async recordContribution(contributionData: Omit<Contribution, 'id' | 'date'>) {
    try {
      const docRef = doc(collection(db, CONTRIBUTIONS_COLLECTION));
      const contribution: Omit<Contribution, 'id'> = {
        ...contributionData,
        date: new Date(),
      };

      await setDoc(docRef, {
        ...contribution,
        date: Timestamp.fromDate(contribution.date),
        createdAt: serverTimestamp(),
      });

      return { id: docRef.id, ...contribution };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to record contribution');
    }
  },

  // Get all contributions
  async getAllContributions() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, CONTRIBUTIONS_COLLECTION), orderBy('date', 'desc'))
      );
      const contributions: Contribution[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        contributions.push({
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(),
        } as Contribution);
      });

      return contributions;
    } catch (error) {
      console.error('Error getting contributions:', error);
      return [];
    }
  },

  // Get contributions by member ID
  async getContributionsByMember(memberId: string) {
    try {
      const q = query(
        collection(db, CONTRIBUTIONS_COLLECTION),
        where('memberId', '==', memberId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const contributions: Contribution[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        contributions.push({
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(),
        } as Contribution);
      });

      return contributions;
    } catch (error) {
      console.error('Error getting member contributions:', error);
      return [];
    }
  },

  // Get contributions by date range
  async getContributionsByDateRange(startDate: Date, endDate: Date) {
    try {
      const querySnapshot = await getDocs(collection(db, CONTRIBUTIONS_COLLECTION));
      const contributions: Contribution[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const contributionDate = data.date?.toDate() || new Date();
        
        if (contributionDate >= startDate && contributionDate <= endDate) {
          contributions.push({
            ...data,
            id: doc.id,
            date: contributionDate,
          } as Contribution);
        }
      });

      return contributions.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting contributions by date range:', error);
      return [];
    }
  },

  // Get total contributions
  async getTotalContributions() {
    try {
      const querySnapshot = await getDocs(collection(db, CONTRIBUTIONS_COLLECTION));
      let total = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        total += data.amount || 0;
      });

      return total;
    } catch (error) {
      console.error('Error getting total contributions:', error);
      return 0;
    }
  },

  // Get total contributions by member
  async getTotalContributionsByMember(memberId: string) {
    try {
      const contributions = await this.getContributionsByMember(memberId);
      return contributions.reduce((sum, c) => sum + c.amount, 0);
    } catch (error) {
      console.error('Error getting total contributions by member:', error);
      return 0;
    }
  },

  // Get contributions by payment method
  async getContributionsByPaymentMethod(paymentMethod: 'cash' | 'momo' | 'bank_transfer') {
    try {
      const q = query(
        collection(db, CONTRIBUTIONS_COLLECTION),
        where('paymentMethod', '==', paymentMethod)
      );
      const querySnapshot = await getDocs(q);
      const contributions: Contribution[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        contributions.push({
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(),
        } as Contribution);
      });

      return contributions;
    } catch (error) {
      console.error('Error getting contributions by payment method:', error);
      return [];
    }
  },

  // Update contribution
  async updateContribution(contributionId: string, contributionData: Partial<Contribution>) {
    try {
      await updateDoc(doc(db, CONTRIBUTIONS_COLLECTION, contributionId), {
        ...contributionData,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update contribution');
    }
  },

  // Delete contribution
  async deleteContribution(contributionId: string) {
    try {
      await deleteDoc(doc(db, CONTRIBUTIONS_COLLECTION, contributionId));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete contribution');
    }
  },

  // Get recent contributions (last 10)
  async getRecentContributions(limit: number = 10) {
    try {
      const contributions = await this.getAllContributions();
      return contributions.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent contributions:', error);
      return [];
    }
  },

  // Get contributions summary for reports
  async getContributionsSummary(startDate?: Date, endDate?: Date) {
    try {
      let contributions: Contribution[] = [];
      
      if (startDate && endDate) {
        contributions = await this.getContributionsByDateRange(startDate, endDate);
      } else {
        contributions = await this.getAllContributions();
      }

      const total = contributions.reduce((sum, c) => sum + c.amount, 0);
      const byMember: Record<string, number> = {};
      const byMethod: Record<string, number> = { cash: 0, momo: 0, bank_transfer: 0 };

      contributions.forEach((c) => {
        byMember[c.memberId] = (byMember[c.memberId] || 0) + c.amount;
        byMethod[c.paymentMethod] = (byMethod[c.paymentMethod] || 0) + c.amount;
      });

      return {
        total,
        count: contributions.length,
        byMember,
        byMethod,
        average: contributions.length > 0 ? total / contributions.length : 0,
      };
    } catch (error) {
      console.error('Error getting contributions summary:', error);
      return { total: 0, count: 0, byMember: {}, byMethod: {}, average: 0 };
    }
  },
};
