export interface User {
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

export interface Tontine {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  monthly_contribution: number;
  max_members: number;
  current_members: number;
  payout_schedule: 'monthly' | 'quarterly' | 'bi-annual';
  total_contributions: number;
  current_payout_turn: number;
  next_payout_date?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  region: string;
  rules?: string;
  is_active: boolean;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  members?: TontineMember[];
  leader?: User;
}

export interface TontineMember {
  id: string;
  tontine_id: string;
  user_id: string;
  payout_position: number;
  has_paid_current_month: boolean;
  total_contributed: number;
  joined_at: string;
  is_active: boolean;
  user?: User;
}

export interface TontinePayment {
  id: string;
  tontine_id: string;
  user_id: string;
  amount: number;
  fee: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  reference?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface TontineInvite {
  id: string;
  tontine_id: string;
  invite_code: string;
  created_by: string;
  max_uses: number;
  current_uses: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface MarketPrice {
  id: string;
  crop: string;
  price: number;
  unit: string;
  region: string;
  submitted_by: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  submitted_by_user?: User;
  verified_by_user?: User;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  region: string;
  likes: number;
  comments: number;
  is_approved: boolean;
  is_flagged: boolean;
  flagged_reason?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  user?: User;
  comments_data?: CommunityComment[];
  likes_data?: CommunityLike[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  user?: User;
}

export interface CommunityLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface WeatherAlert {
  id: string;
  region: string;
  alert_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  feelsLike: number;
  location?: string;
  uvIndex?: number;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_response?: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export type Language = 'en' | 'fr' | 'pid';

export type Theme = 'light' | 'dark';

export interface AuthState {
  user: User | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
}

export interface AppState {
  language: Language;
  theme: Theme;
  isOnline: boolean;
  currentView: string;
  tourCompleted: boolean;
}