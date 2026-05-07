import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';
import { authService } from '@/services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { userData } = await authService.signIn(email, password);
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.signOut();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Logout failed', 
            isLoading: false 
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const userData = await authService.getCurrentUserData();
          if (userData) {
            set({ 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      updateUser: async (data: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        try {
          await authService.updateUserProfile(currentUser.id, data);
          set({
            user: { ...currentUser, ...data },
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to update profile' });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Role-based access control helpers
export const hasRole = (requiredRoles: UserRole[]) => {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  return requiredRoles.includes(user.role);
};

export const isAdmin = () => hasRole(['admin']);
export const isManagement = () => hasRole(['admin', 'management']);
export const isMember = () => hasRole(['admin', 'management', 'member']);
