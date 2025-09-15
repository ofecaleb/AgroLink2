import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        };
        Insert: {
          id?: string;
          email: string;
          phone: string;
          name: string;
          avatar_url?: string;
          country?: string;
          region: string;
          language?: string;
          currency?: string;
          role?: string;
          plan?: string;
          balance?: number;
          is_active?: boolean;
          is_verified?: boolean;
          last_active?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          name?: string;
          avatar_url?: string;
          country?: string;
          region?: string;
          language?: string;
          currency?: string;
          role?: string;
          plan?: string;
          balance?: number;
          is_active?: boolean;
          is_verified?: boolean;
          last_active?: string;
          metadata?: any;
        };
      };
    };
  };
}