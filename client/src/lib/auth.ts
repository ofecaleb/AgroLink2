import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar_url?: string;
  country: string;
  region: string;
  language: string;
  currency: string;
  role: string;
  plan: string;
  balance: number;
  is_active: boolean;
  is_verified: boolean;
  last_active?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  phone: string;
  password: string;
  name: string;
  country: string;
  region: string;
  language?: string;
  currency?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: Session | null;
  error?: string;
}

export interface PasswordResetData {
  email?: string;
  phone?: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private currentSession: Session | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.currentSession = session;
        await this.loadUserProfile(session.user.id);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        this.currentSession = session;
        
        if (session?.user) {
          await this.loadUserProfile(session.user.id);
        } else {
          this.currentUser = null;
        }

        // Emit custom event for components to listen
        window.dispatchEvent(new CustomEvent('authStateChange', {
          detail: { event, session, user: this.currentUser }
        }));
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      this.currentUser = data;
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async signUp(userData: RegisterData): Promise<AuthResponse> {
    try {
      // First, sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
          }
        }
      });

      if (authError) {
        return { user: null, session: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, session: null, error: 'Failed to create user account' };
      }

      // Create user profile in our users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          phone: userData.phone,
          name: userData.name,
          country: userData.country,
          region: userData.region,
          language: userData.language || 'en',
          currency: userData.currency || 'XAF',
          role: 'user',
          plan: 'free',
          balance: 0,
          is_active: true,
          is_verified: false
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { user: null, session: null, error: 'Failed to create user profile' };
      }

      this.currentUser = profileData;
      this.currentSession = authData.session;

      return { 
        user: profileData, 
        session: authData.session, 
        error: undefined 
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { user: null, session: null, error: error.message || 'Registration failed' };
    }
  }

  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      let email = credentials.email;

      // If phone is provided instead of email, look up email by phone
      if (credentials.phone && !credentials.email) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('phone', credentials.phone)
          .single();

        if (userError || !userData) {
          return { user: null, session: null, error: 'User not found with this phone number' };
        }

        email = userData.email;
      }

      if (!email) {
        return { user: null, session: null, error: 'Email or phone number is required' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, session: null, error: 'Login failed' };
      }

      await this.loadUserProfile(data.user.id);
      this.currentSession = data.session;

      // Update last active timestamp
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.user.id);

      return { 
        user: this.currentUser, 
        session: data.session, 
        error: undefined 
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { user: null, session: null, error: error.message || 'Login failed' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      this.currentUser = null;
      this.currentSession = null;

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error: error.message || 'Logout failed' };
    }
  }

  async resetPassword(data: PasswordResetData): Promise<{ error?: string; message?: string }> {
    try {
      let email = data.email;

      // If phone is provided instead of email, look up email by phone
      if (data.phone && !data.email) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('phone', data.phone)
          .single();

        if (userError || !userData) {
          return { error: 'User not found with this phone number' };
        }

        email = userData.email;
      }

      if (!email) {
        return { error: 'Email or phone number is required' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { message: 'Password reset email sent successfully' };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { error: error.message || 'Password reset failed' };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error?: string; message?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: error.message };
      }

      return { message: 'Password updated successfully' };
    } catch (error: any) {
      console.error('Password update error:', error);
      return { error: error.message || 'Password update failed' };
    }
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<{ error?: string; user?: AuthUser }> {
    try {
      if (!this.currentUser) {
        return { error: 'No user logged in' };
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      this.currentUser = data;
      return { user: data };
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { error: error.message || 'Profile update failed' };
    }
  }

  async resendVerificationEmail(): Promise<{ error?: string; message?: string }> {
    try {
      if (!this.currentSession?.user?.email) {
        return { error: 'No email found for current user' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: this.currentSession.user.email,
      });

      if (error) {
        return { error: error.message };
      }

      return { message: 'Verification email sent successfully' };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return { error: error.message || 'Failed to resend verification email' };
    }
  }

  getUser(): AuthUser | null {
    return this.currentUser;
  }

  getSession(): Session | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentUser !== null;
  }

  isEmailVerified(): boolean {
    return this.currentSession?.user?.email_confirmed_at !== null;
  }
}

export const authService = AuthService.getInstance();