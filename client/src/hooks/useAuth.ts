import { useState, useEffect, useCallback } from 'react';
import { authService, type LoginCredentials } from '../lib/auth';
import type { User, AuthState } from '../types';
import { getUser, createUser, requestReset } from '../lib/api';

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
    let payload: any = {};
    if (usePassword) {
      // If identifier looks like an email, use email+password
      if (identifier.includes('@')) {
        payload = { email: identifier, password: secret };
      } else {
        // Otherwise, treat as phone+password (not supported by backend)
        // Fallback: treat as email+password
        payload = { email: identifier, password: secret };
      }
    } else {
      // PIN login: always use phone+pin
      payload = { phone: identifier, pin: secret };
    }
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const register = async (data: any) => {
    return createUser(data);
  };

  const resetPassword = async (data: any) => {
    return requestReset(data);
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
