import { apiRequest } from './queryClient';
import { authService } from './auth';
import type { 
  Tontine, 
  TontinePayment, 
  MarketPrice, 
  CommunityPost, 
  WeatherAlert, 
  WeatherData 
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
    const response = await authenticatedRequest('POST', '/api/tontines', data);
    return response.json();
  }

  static async getTontines(): Promise<Tontine[]> {
    const response = await authenticatedRequest('GET', '/api/tontines');
    return response.json();
  }

  static async getTontine(id: number): Promise<Tontine> {
    const response = await authenticatedRequest('GET', `/api/tontines/${id}`);
    return response.json();
  }

  static async joinTontine(id: number): Promise<void> {
    await authenticatedRequest('POST', `/api/tontines/${id}/join`);
  }

  // Tontine Payment API
  static async createTontinePayment(tontineId: number, data: { amount: number; paymentMethod: string }): Promise<TontinePayment> {
    const response = await authenticatedRequest('POST', `/api/tontines/${tontineId}/payments`, data);
    return response.json();
  }

  static async getTontinePayments(tontineId: number): Promise<TontinePayment[]> {
    const response = await authenticatedRequest('GET', `/api/tontines/${tontineId}/payments`);
    return response.json();
  }

  // Market Price API
  static async getMarketPrices(region?: string): Promise<MarketPrice[]> {
    const url = region ? `/api/market-prices?region=${region}` : '/api/market-prices';
    const response = await authenticatedRequest('GET', url);
    return response.json();
  }

  static async createMarketPrice(data: { crop: string; price: number; unit?: string }): Promise<MarketPrice> {
    const response = await authenticatedRequest('POST', '/api/market-prices', data);
    return response.json();
  }

  // Community API
  static async getCommunityPosts(region?: string, limit?: number): Promise<{ post: CommunityPost; user: any }[]> {
    let url = '/api/community/posts';
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
    const response = await authenticatedRequest('POST', '/api/community/posts', data);
    return response.json();
  }

  // Weather API
  static async getWeatherAlerts(region?: string): Promise<WeatherAlert[]> {
    const url = region ? `/api/weather/alerts?region=${region}` : '/api/weather/alerts';
    const response = await authenticatedRequest('GET', url);
    return response.json();
  }

  static async getCurrentWeather(region?: string): Promise<WeatherData> {
    const url = region ? `/api/weather/current?region=${region}` : '/api/weather/current';
    const response = await authenticatedRequest('GET', url);
    return response.json();
  }
}
