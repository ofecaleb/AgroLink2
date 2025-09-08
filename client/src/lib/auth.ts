import type { User } from '../types';

export interface LoginCredentials {
  phone: string;
  pin?: string;
  password?: string;
}

export interface RegisterData {
  phone: string;
  pin: string;
  password?: string;
  name: string;
  region: string;
  email?: string;
  country?: string;
  language?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    // Load auth data from localStorage
    this.token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('authUser');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (e) {
        console.error('Failed to parse user data from localStorage');
        this.clearAuth();
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await response.json() as AuthResponse;
    
    this.setAuth(data.token, data.user);
    return data;
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await response.json();
    return data.user;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    
    this.clearAuth();
  }

  async refreshProfile(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh profile');
      }
      
      const user = await response.json() as User;
      this.setUser(user);
      return user;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      this.clearAuth();
      return null;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  private setAuth(token: string, user: User): void {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
  }

  private setUser(user: User): void {
    this.user = user;
    localStorage.setItem('authUser', JSON.stringify(user));
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }

  // Session management
  private sessionTimeout: NodeJS.Timeout | null = null;

  setupSessionTimeout(): void {
    this.clearSessionTimeout();
    
    // Set timeout for 25 minutes (less than server's 30 minutes)
    this.sessionTimeout = setTimeout(() => {
      this.logout();
      // You can emit an event here to show session expired notification
      window.dispatchEvent(new CustomEvent('sessionExpired'));
    }, 25 * 60 * 1000);
  }

  resetSessionTimeout(): void {
    if (this.isAuthenticated()) {
      this.setupSessionTimeout();
    }
  }

  clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  // Activity tracking
  setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      this.resetSessionTimeout();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
  }
}

export const authService = AuthService.getInstance();
