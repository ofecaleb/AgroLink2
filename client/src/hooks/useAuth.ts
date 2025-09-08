import { useState, useEffect, useCallback } from 'react';
import { authService, type LoginCredentials } from '../lib/auth';
import type { User, AuthState } from '../types';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: authService.getUser(),
    token: authService.getToken(),
    isAuthenticated: authService.isAuthenticated(),
    isLoading: false
  });

  // Force re-render when auth state changes
  const [, forceUpdate] = useState({});

  const updateAuthState = useCallback((newState: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...newState }));
    forceUpdate({});
  }, []);

  useEffect(() => {
    // Set up session management
    authService.setupSessionTimeout();
    authService.setupActivityTracking();

    // Listen for session expired events
    const handleSessionExpired = () => {
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      authService.clearSessionTimeout();
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [updateAuthState]);

  // Accepts either (email, password) or (phone, pin)
  const login = async (identifier: string, secret: string, usePassword: boolean) => {
    try {
      updateAuthState({ isLoading: true });
      
      let credentials: LoginCredentials = { phone: '' };
      
      if (usePassword) {
        if (identifier.includes('@')) {
          credentials = { phone: '', email: identifier, password: secret };
        } else {
          credentials = { phone: identifier, password: secret };
        }
      } else {
        credentials = { phone: identifier, pin: secret };
      }
      
      const result = await authService.login(credentials);
      
      updateAuthState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false
      });
      
      return { success: true };
    } catch (error: any) {
      updateAuthState({ isLoading: false });
      return { success: false, error: error.message };
    }
  };

  const register = async (data: any) => {
    try {
      updateAuthState({ isLoading: true });
      
      const user = await authService.register(data);
      
      updateAuthState({ isLoading: false });
      
      return { success: true, user };
    } catch (error: any) {
      updateAuthState({ isLoading: false });
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (data: any) => {
    try {
      // Implementation for password reset
      return { success: true, message: 'Reset request sent' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    updateAuthState({ isLoading: true });
    
    try {
      await authService.logout();
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      // Force a page refresh to clear any cached state
      window.location.reload();
    } catch (error) {
      // Even if logout fails on server, clear local auth state
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      // Force a page refresh to clear any cached state
      window.location.reload();
    }
  };

  const refreshProfile = async () => {
    try {
      const user = await authService.refreshProfile();
      if (user) {
        updateAuthState({ user });
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return {
    ...authState,
    login,
    register,
    resetPassword,
    logout,
    refreshProfile
  };
}
