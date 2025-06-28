export interface User {
  id: number;
  phone: string;
  email?: string;
  name: string;
  country: string;
  region: string;
  language: string;
  currency: string;
  profilePicture?: string;
  plan: string;
  role: string;
  balance: number;
  lastActive: string;
  createdAt: string;
}

export interface Tontine {
  id: number;
  name: string;
  leaderId: number;
  monthlyContribution: number;
  totalContributions: number;
  currentPayoutTurn: number;
  nextPayoutDate: string | null;
  status: string;
  region: string;
  createdAt: string;
  members?: TontineMember[];
}

export interface TontineMember {
  id: number;
  tontineId: number;
  userId: number;
  joinedAt: string;
  hasPaidCurrentMonth: boolean;
  payoutPosition: number;
  user?: User;
}

export interface TontinePayment {
  id: number;
  tontineId: number;
  userId: number;
  amount: number;
  fee: number;
  paymentMethod: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
}

export interface MarketPrice {
  id: number;
  crop: string;
  price: number;
  unit: string;
  region: string;
  submittedBy: number;
  isVerified: boolean;
  verifiedBy: number | null;
  createdAt: string;
}

export interface CommunityPost {
  id: number;
  userId: number;
  content: string;
  region: string;
  likes: number;
  comments: number;
  createdAt: string;
  user?: User;
}

export interface WeatherAlert {
  id: number;
  region: string;
  alertType: string;
  message: string;
  severity: string;
  isActive: boolean;
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  feelsLike: number;
}

export type Language = 'en' | 'fr' | 'pid';

export type Theme = 'light' | 'dark';

export type Region = 'bamenda' | 'douala' | 'yaounde' | 'bafoussam';

export type PaymentMethod = 'momo' | 'orange_money';

export type PaymentStatus = 'pending' | 'completed' | 'failed';

export type AlertSeverity = 'low' | 'medium' | 'high';

export type UserRole = 'user' | 'admin';

export type UserPlan = 'free' | 'premium';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppState {
  language: Language;
  theme: Theme;
  isOnline: boolean;
  currentView: string;
  sessionTimeout: NodeJS.Timeout | null;
  tourCompleted: boolean;
}

export interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TontineInvite {
  id: number;
  tontineId: number;
  inviteCode: string;
  createdBy: number;
  maxUses: number;
  currentUses: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CommunityComment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: User;
}

export interface CommunityLike {
  id: number;
  postId: number;
  userId: number;
  createdAt: string;
}
