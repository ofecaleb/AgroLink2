import { apiRequest } from './queryClient';
import { authService } from './auth';
import type { 
  Tontine, 
  TontinePayment, 
  MarketPrice, 
  CommunityPost, 
  WeatherAlert, 
  WeatherData,
  TontineInvite,
  User,
  SupportTicket,
  CommunityComment
} from '../types';

// Add auth header to requests
const authenticatedRequest = async (method: string, url: string, data?: unknown) => {
  const token = authService.getToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(!data ? {} : {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
};

export class ApiService {
  // Tontine API
  static async createTontine(data: { name: string; monthlyContribution: number }): Promise<Tontine> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/tontines`, data);
    return response.json();
  }

  static async getTontines(): Promise<Tontine[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/tontines`);
    return response.json();
  }

  static async getTontine(id: number): Promise<Tontine> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/tontines/${id}`);
    return response.json();
  }

  static async joinTontine(id: number): Promise<void> {
    await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/tontines/${id}/join`);
  }

  // Tontine Payment API
  static async createTontinePayment(tontineId: number, data: { amount: number; paymentMethod: string }): Promise<TontinePayment> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/tontines/${tontineId}/payments`, data);
    return response.json();
  }

  static async getTontinePayments(tontineId: number): Promise<TontinePayment[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/tontines/${tontineId}/payments`);
    return response.json();
  }

  // Market Price API
  static async getMarketPrices(region?: string): Promise<MarketPrice[]> {
    const url = region ? `${import.meta.env.VITE_API_URL}/api/market-prices?region=${region}` : `${import.meta.env.VITE_API_URL}/api/market-prices`;
    const response = await authenticatedRequest('GET', url);
    return response.json();
  }

  static async createMarketPrice(data: { crop: string; price: number; unit?: string }): Promise<MarketPrice> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/market-prices`, data);
    return response.json();
  }

  static async verifyMarketPrice(priceId: number): Promise<void> {
    await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/market-prices/${priceId}/verify`);
  }

  // Community API
  static async getCommunityPosts(region?: string, limit?: number): Promise<{ post: CommunityPost; user: any }[]> {
    let url = `${import.meta.env.VITE_API_URL}/api/community/posts`;
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (limit) params.append('limit', limit.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await authenticatedRequest('GET', url);
    return response.json();
  }

  static async createCommunityPost(data: { content: string }): Promise<CommunityPost> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/community/posts`, data);
    return response.json();
  }

  // Weather API
  static async getWeatherAlerts(region?: string): Promise<WeatherAlert[]> {
    const url = region ? `${import.meta.env.VITE_API_URL}/api/weather/alerts?region=${region}` : `${import.meta.env.VITE_API_URL}/api/weather/alerts`;
    const response = await authenticatedRequest('GET', url);
    return response.json();
  }

  static async getCurrentWeather(region?: string): Promise<WeatherData> {
    const url = region ? `${import.meta.env.VITE_API_URL}/api/weather/current?region=${region}` : `${import.meta.env.VITE_API_URL}/api/weather/current`;
    const response = await authenticatedRequest('GET', url);
    return response.json();
  }

  // User profile management
  static async updateUserProfile(data: Partial<User>): Promise<User> {
    const response = await authenticatedRequest('PUT', `${import.meta.env.VITE_API_URL}/api/user/profile`, data);
    return response.json();
  }

  // Password change
  static async changePassword(currentPin: string, newPin: string): Promise<{ message: string; user: User }> {
    const response = await authenticatedRequest('PUT', `${import.meta.env.VITE_API_URL}/api/user/password`, { currentPin, newPin });
    return response.json();
  }

  // Support tickets
  static async createSupportTicket(data: { subject: string; message: string; category: string; priority: string }): Promise<SupportTicket> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/support/tickets`, data);
    return response.json();
  }

  static async getSupportTickets(): Promise<SupportTicket[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/support/tickets`);
    return response.json();
  }

  // Community interactions
  static async createCommunityComment(postId: number, content: string): Promise<CommunityComment> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/community/comments`, { postId, content });
    return response.json();
  }

  static async getPostComments(postId: number): Promise<CommunityComment[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/community/posts/${postId}/comments`);
    return response.json();
  }

  static async likePost(postId: number): Promise<void> {
    await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/community/posts/${postId}/like`);
  }

  static async unlikePost(postId: number): Promise<void> {
    await authenticatedRequest('DELETE', `${import.meta.env.VITE_API_URL}/api/community/posts/${postId}/unlike`);
  }

  // Tontine invites
  static async createTontineInvite(tontineId: number, data: { maxUses?: number; expiresAt?: string }): Promise<TontineInvite> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/tontine-invites`, { tontineId, ...data });
    return response.json();
  }

  static async joinTontineByCode(inviteCode: string): Promise<void> {
    await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/tontine-invites/join`, { inviteCode });
  }

  // User search for invites
  static async searchUsers(query: string): Promise<User[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/users/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }

  // Direct invite by user ID
  static async inviteUserToTontine(tontineId: number, userId: number): Promise<void> {
    await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/tontines/${tontineId}/invite-user`, { userId });
  }

  // Admin API Methods
  static async getAdminStats(): Promise<any> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/admin/stats`);
    return response.json();
  }

  static async getPendingTontines(): Promise<any[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/admin/tontines/pending`);
    return response.json();
  }

  static async getPendingPrices(): Promise<any[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/admin/prices/pending`);
    return response.json();
  }

  static async getSuspendedUsers(): Promise<any[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/admin/users/suspended`);
    return response.json();
  }

  static async getFlaggedPosts(): Promise<any[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/admin/posts/flagged`);
    return response.json();
  }

  static async adminAction(type: string, id: number, action: string): Promise<void> {
    await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/admin/${type}/${id}/${action}`);
  }

  // Admin Support Ticket API
  static async getAllSupportTickets(): Promise<SupportTicket[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/admin/support/tickets`);
    return response.json();
  }

  static async updateSupportTicket(id: number, data: Partial<SupportTicket>): Promise<SupportTicket> {
    const response = await authenticatedRequest('PATCH', `${import.meta.env.VITE_API_URL}/api/admin/support/tickets/${id}`, data);
    return response.json();
  }

  // Support Ticket Notifications
  static async getSupportNotifications(): Promise<SupportTicket[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/support/notifications`);
    return response.json();
  }

  // Admin Premium Plan Management
  static async getPremiumPlans(): Promise<any[]> {
    const response = await authenticatedRequest('GET', `${import.meta.env.VITE_API_URL}/api/admin/premium/plans`);
    return response.json();
  }

  static async createPremiumPlan(data: any): Promise<any> {
    const response = await authenticatedRequest('POST', `${import.meta.env.VITE_API_URL}/api/admin/premium/plans`, data);
    return response.json();
  }

  static async updatePremiumPlan(key: string, data: any): Promise<any> {
    const response = await authenticatedRequest('PUT', `${import.meta.env.VITE_API_URL}/api/admin/premium/plans/${key}`, data);
    return response.json();
  }

  static async deactivatePremiumPlan(key: string): Promise<any> {
    const response = await authenticatedRequest('DELETE', `${import.meta.env.VITE_API_URL}/api/admin/premium/plans/${key}`);
    return response.json();
  }
}

export async function getUser(id: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createUser(data: any) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function requestReset(data: any) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reset-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getYields(region: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/yields?region=${encodeURIComponent(region)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function insertYield(data: any) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/yields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function backupUser(data: any) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/backup-users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
