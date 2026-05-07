import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { User, UserRole } from '@/types';

const USERS_COLLECTION = 'users';

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string, phone: string, role: UserRole = 'member') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName: fullName });

      // Create user document in Firestore
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        email,
        fullName,
        phone,
        role,
        isActive: true,
      };

      await setDoc(doc(db, USERS_COLLECTION, user.uid), {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return { user, userData };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data() as User;
      
      if (!userData.isActive) {
        await signOut(auth);
        throw new Error('Account is deactivated. Please contact admin.');
      }

      return { user, userData };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  // Get current user data
  async getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      return { ...userDoc.data(), id: user.uid } as User;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Password reset
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, data: Partial<User>) {
    try {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // Get user by ID
  async getUserById(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      return { ...userDoc.data(), id: userDoc.id } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Get all users (admin only)
  async getAllUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ ...doc.data(), id: doc.id } as User);
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  // Get users by role
  async getUsersByRole(role: UserRole) {
    try {
      const q = query(collection(db, USERS_COLLECTION), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ ...doc.data(), id: doc.id } as User);
      });

      return users;
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  },
};
