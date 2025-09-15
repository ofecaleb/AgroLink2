import { useState, useEffect, useCallback } from 'react';
import { authService, type LoginCredentials, type RegisterData, type AuthUser } from '../lib/auth';

export interface AuthState {
  user: AuthUser | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: authService.getUser(),
    session: authService.getSession(),
    isAuthenticated: authService.isAuthenticated(),
    isLoading: true,
    isEmailVerified: authService.isEmailVerified()
  });

  const updateAuthState = useCallback(() => {
    setAuthState({
      user: authService.getUser(),
      session: authService.getSession(),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
      isEmailVerified: authService.isEmailVerified()
    });
  }, []);

  useEffect(() => {
    // Initial state update
    updateAuthState();

    // Listen for auth state changes
    const handleAuthStateChange = () => {
      updateAuthState();
    };

    window.addEventListener('authStateChange', handleAuthStateChange);

    return () => {
      window.removeEventListener('authStateChange', handleAuthStateChange);
    };
  }, [updateAuthState]);

  const login = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await authService.signIn(credentials);
      
      if (result.error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error };
      }

      updateAuthState();
      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (userData: RegisterData) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await authService.signUp(userData);
      
      if (result.error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error };
      }

      updateAuthState();
      return { success: true, user: result.user };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await authService.signOut();
      
      if (result.error) {
        console.error('Logout error:', result.error);
      }

      updateAuthState();
    } catch (error) {
      console.error('Logout error:', error);
      updateAuthState();
    }
  };

  const resetPassword = async (data: { email?: string; phone?: string }) => {
    try {
      const result = await authService.resetPassword(data);
      return result;
    } catch (error: any) {
      return { error: error.message || 'Password reset failed' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const result = await authService.updatePassword(newPassword);
      return result;
    } catch (error: any) {
      return { error: error.message || 'Password update failed' };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      const result = await authService.updateProfile(updates);
      if (result.user) {
        updateAuthState();
      }
      return result;
    } catch (error: any) {
      return { error: error.message || 'Profile update failed' };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const result = await authService.resendVerificationEmail();
      return result;
    } catch (error: any) {
      return { error: error.message || 'Failed to resend verification email' };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    resendVerificationEmail
  };
}