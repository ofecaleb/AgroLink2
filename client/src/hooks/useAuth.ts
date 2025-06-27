import { useState, useEffect } from 'react';
import { authService } from '../lib/auth';
import type { User, AuthState } from '../types';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: authService.getUser(),
    token: authService.getToken(),
    isAuthenticated: authService.isAuthenticated(),
    isLoading: false
  });

  useEffect(() => {
    // Set up session management
    authService.setupSessionTimeout();
    authService.setupActivityTracking();

    // Listen for session expired events
    const handleSessionExpired = () => {
      setAuthState({
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
  }, []);

  const login = async (phone: string, pin: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await authService.login({ phone, pin });
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      });
      
      authService.setupSessionTimeout();
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const register = async (userData: { phone: string; pin: string; name: string; region: string }) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.register(userData);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      // Even if logout fails on server, clear local auth state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  const refreshProfile = async () => {
    try {
      const user = await authService.refreshProfile();
      if (user) {
        setAuthState(prev => ({ ...prev, user }));
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    refreshProfile
  };
}
