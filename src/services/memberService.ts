import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { Member } from '@/types';

const MEMBERS_COLLECTION = 'members';

export const memberService = {
  // Create a new member
  async createMember(memberData: Omit<Member, 'id' | 'totalContributed' | 'totalBorrowed' | 'loanBalance'>) {
    try {
      const docRef = doc(collection(db, MEMBERS_COLLECTION));
      const member: Omit<Member, 'id'> = {
        ...memberData,
        totalContributed: 0,
        totalBorrowed: 0,
        loanBalance: 0,
      };

      await setDoc(docRef, {
        ...member,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, ...member };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create member');
    }
  },

  // Get all members
  async getAllMembers() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, MEMBERS_COLLECTION), orderBy('fullName', 'asc'))
      );
      const members: Member[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          ...data,
          id: doc.id,
          joinedDate: data.joinedDate?.toDate() || new Date(),
        } as Member);
      });

      return members;
    } catch (error) {
      console.error('Error getting members:', error);
      return [];
    }
  },

  // Get active members only
  async getActiveMembers() {
    try {
      const q = query(
        collection(db, MEMBERS_COLLECTION),
        where('isActive', '==', true),
        orderBy('fullName', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const members: Member[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          ...data,
          id: doc.id,
          joinedDate: data.joinedDate?.toDate() || new Date(),
        } as Member);
      });

      return members;
    } catch (error) {
      console.error('Error getting active members:', error);
      return [];
    }
  },

  // Get member by ID
  async getMemberById(memberId: string) {
    try {
      const memberDoc = await getDoc(doc(db, MEMBERS_COLLECTION, memberId));
      
      if (!memberDoc.exists()) {
        return null;
      }

      const data = memberDoc.data();
      return {
        ...data,
        id: memberDoc.id,
        joinedDate: data.joinedDate?.toDate() || new Date(),
      } as Member;
    } catch (error) {
      console.error('Error getting member:', error);
      return null;
    }
  },

  // Update member
  async updateMember(memberId: string, memberData: Partial<Member>) {
    try {
      await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
        ...memberData,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update member');
    }
  },

  // Delete member (soft delete - set isActive to false)
  async deleteMember(memberId: string) {
    try {
      await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete member');
    }
  },

  // Permanently delete member (admin only)
  async permanentlyDeleteMember(memberId: string) {
    try {
      await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to permanently delete member');
    }
  },

  // Update member contribution totals
  async updateMemberContribution(memberId: string, amount: number) {
    try {
      const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }

      const currentTotal = memberDoc.data().totalContributed || 0;
      await updateDoc(memberRef, {
        totalContributed: currentTotal + amount,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update contribution');
    }
  },

  // Update member loan balance
  async updateMemberLoanBalance(memberId: string, borrowedAmount: number, repaidAmount: number = 0) {
    try {
      const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }

      const data = memberDoc.data();
      const currentBorrowed = data.totalBorrowed || 0;
      const currentBalance = data.loanBalance || 0;

      await updateDoc(memberRef, {
        totalBorrowed: currentBorrowed + borrowedAmount,
        loanBalance: currentBalance + borrowedAmount - repaidAmount,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update loan balance');
    }
  },

  // Search members by name or phone
  async searchMembers(searchTerm: string) {
    try {
      const querySnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
      const members: Member[] = [];
      const term = searchTerm.toLowerCase();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fullName = (data.fullName || '').toLowerCase();
        const phone = (data.phone || '').toLowerCase();
        
        if (fullName.includes(term) || phone.includes(term)) {
          members.push({
            ...data,
            id: doc.id,
            joinedDate: data.joinedDate?.toDate() || new Date(),
          } as Member);
        }
      });

      return members;
    } catch (error) {
      console.error('Error searching members:', error);
      return [];
    }
  },
};
