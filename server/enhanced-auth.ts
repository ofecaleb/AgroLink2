import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbManager } from './database-config.js';
import { multiDbStorage } from './multi-db-storage.js';
import { users, type User, type InsertUser } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Enhanced Authentication Configuration
interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  resetTokenExpiry: number; // minutes
  emailConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  twilioConfig: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
}

export class EnhancedAuth {
  private config: AuthConfig;
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private resetTokens: Map<string, { token: string; expires: number; type: 'email' | 'whatsapp' }> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
    this.cleanupExpiredTokens();
  }

  // Enhanced user registration with multi-database support
  async registerUser(userData: Omit<InsertUser, 'passwordHash' | 'pinHash'> & { password: string; pin: string }): Promise<{ user: User; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByPhone(userData.phone);
      if (existingUser) {
        throw new Error('User with this phone number already exists');
      }

      // Hash password and PIN
      const passwordHash = await bcrypt.hash(userData.password, this.config.bcryptRounds);
      const pinHash = await bcrypt.hash(userData.pin, this.config.bcryptRounds);

      // Create user in primary database
      const user = await multiDbStorage.createUser({
        ...userData,
        passwordHash,
        pinHash,
        role: userData.role || 'farmer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Generate JWT token
      const token = this.generateToken(user);

      // Log registration analytics
      await this.logUserAnalytics(user.id, 'registration');

      return { user, token };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Enhanced login with multi-factor support
  async loginUser(phone: string, password: string, pin?: string): Promise<{ user: User; token: string; requiresPin: boolean }> {
    try {
      // Check for account lockout
      if (this.isAccountLocked(phone)) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      // Find user
      const user = await this.findUserByPhone(phone);
      if (!user) {
        this.recordFailedAttempt(phone);
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        this.recordFailedAttempt(phone);
        throw new Error('Invalid credentials');
      }

      // Check if PIN is required
      if (user.requiresPin && !pin) {
        return { user, token: '', requiresPin: true };
      }

      // Verify PIN if provided
      if (pin) {
        const isPinValid = await bcrypt.compare(pin, user.pinHash);
        if (!isPinValid) {
          this.recordFailedAttempt(phone);
          throw new Error('Invalid PIN');
        }
      }

      // Clear failed attempts on successful login
      this.loginAttempts.delete(phone);

      // Generate JWT token
      const token = this.generateToken(user);

      // Update last login
      await this.updateLastLogin(user.id);

      // Log login analytics
      await this.logUserAnalytics(user.id, 'login');

      return { user, token, requiresPin: false };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Enhanced password/PIN reset system
  async initiateReset(phone: string, type: 'password' | 'pin', method: 'email' | 'whatsapp'): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.findUserByPhone(phone);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate reset token
      const resetToken = this.generateResetToken();
      const expires = Date.now() + (this.config.resetTokenExpiry * 60 * 1000);

      // Store reset token
      this.resetTokens.set(`${phone}:${type}`, {
        token: resetToken,
        expires,
        type: method
      });

      // Send reset code via email or WhatsApp
      if (method === 'email') {
        await this.sendResetEmail(user.email, resetToken, type);
      } else {
        await this.sendResetWhatsApp(phone, resetToken, type);
      }

      // Log reset request analytics
      await this.logUserAnalytics(user.id, 'reset_requested');

      return {
        success: true,
        message: `Reset code sent via ${method === 'email' ? 'email' : 'WhatsApp'}`
      };
    } catch (error) {
      console.error('Reset initiation error:', error);
      throw error;
    }
  }

  // Complete password/PIN reset
  async completeReset(phone: string, type: 'password' | 'pin', token: string, newValue: string): Promise<{ success: boolean; message: string }> {
    try {
      const resetKey = `${phone}:${type}`;
      const resetData = this.resetTokens.get(resetKey);

      if (!resetData || resetData.token !== token || Date.now() > resetData.expires) {
        throw new Error('Invalid or expired reset token');
      }

      const user = await this.findUserByPhone(phone);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password or PIN
      const hash = await bcrypt.hash(newValue, this.config.bcryptRounds);

      // Update user
      if (type === 'password') {
        await this.updateUserPassword(user.id, hash);
      } else {
        await this.updateUserPin(user.id, hash);
      }

      // Clear reset token
      this.resetTokens.delete(resetKey);

      // Log reset completion analytics
      await this.logUserAnalytics(user.id, 'reset_completed');

      return {
        success: true,
        message: `${type === 'password' ? 'Password' : 'PIN'} reset successfully`
      };
    } catch (error) {
      console.error('Reset completion error:', error);
      throw error;
    }
  }

  // Verify JWT token
  verifyToken(token: string): { userId: number; role: string } | null {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;
      return {
        userId: decoded.userId,
        role: decoded.role
      };
    } catch (error) {
      return null;
    }
  }

  // Find user by phone number
  private async findUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const { connection } = await dbManager.routeData('read', 'users');
      const [user] = await connection
        .select()
        .from(users)
        .where(eq(users.phone, phone));
      
      return user;
    } catch (error) {
      console.error('Error finding user by phone:', error);
      return undefined;
    }
  }

  // Generate JWT token
  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role
      },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiresIn }
    );
  }

  // Generate reset token
  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Check if account is locked
  private isAccountLocked(phone: string): boolean {
    const attempts = this.loginAttempts.get(phone);
    if (!attempts) return false;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const lockoutDurationMs = this.config.lockoutDuration * 60 * 1000;

    return attempts.count >= this.config.maxLoginAttempts && timeSinceLastAttempt < lockoutDurationMs;
  }

  // Record failed login attempt
  private recordFailedAttempt(phone: string): void {
    const attempts = this.loginAttempts.get(phone) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(phone, attempts);
  }

  // Update last login
  private async updateLastLogin(userId: number): Promise<void> {
    try {
      const { connection } = await dbManager.routeData('write', 'users');
      await connection
        .update(users)
        .set({ lastActive: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Update user password
  private async updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    try {
      const { connection } = await dbManager.routeData('write', 'users');
      await connection
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Update user PIN
  private async updateUserPin(userId: number, pinHash: string): Promise<void> {
    try {
      const { connection } = await dbManager.routeData('write', 'users');
      await connection
        .update(users)
        .set({ pinHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating PIN:', error);
      throw error;
    }
  }

  // Send reset email
  private async sendResetEmail(email: string, token: string, type: 'password' | 'pin'): Promise<void> {
    try {
      const transporter = nodemailer.createTransporter(this.config.emailConfig);

      const mailOptions = {
        from: this.config.emailConfig.auth.user,
        to: email,
        subject: `AgroLink ${type === 'password' ? 'Password' : 'PIN'} Reset`,
        html: `
          <h2>AgroLink ${type === 'password' ? 'Password' : 'PIN'} Reset</h2>
          <p>Your reset code is: <strong>${token}</strong></p>
          <p>This code will expire in ${this.config.resetTokenExpiry} minutes.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending reset email:', error);
      throw error;
    }
  }

  // Send reset WhatsApp message
  private async sendResetWhatsApp(phone: string, token: string, type: 'password' | 'pin'): Promise<void> {
    try {
      const client = twilio(this.config.twilioConfig.accountSid, this.config.twilioConfig.authToken);

      const message = `AgroLink ${type === 'password' ? 'Password' : 'PIN'} Reset\n\nYour reset code is: ${token}\n\nThis code will expire in ${this.config.resetTokenExpiry} minutes.\n\nIf you didn't request this reset, please ignore this message.`;

      await client.messages.create({
        body: message,
        from: `whatsapp:${this.config.twilioConfig.phoneNumber}`,
        to: `whatsapp:${phone}`
      });

      console.log(`Reset WhatsApp message sent to ${phone}`);
    } catch (error) {
      console.error('Error sending reset WhatsApp message:', error);
      throw error;
    }
  }

  // Log user analytics
  private async logUserAnalytics(userId: number, action: string): Promise<void> {
    try {
      const supabase = dbManager.getConnection('supabase');
      if (supabase) {
        await supabase.from('user_analytics').insert({
          user_id: userId,
          action,
          timestamp: new Date().toISOString(),
          metadata: { source: 'enhanced_auth' }
        });
      }
    } catch (error) {
      console.error('Error logging user analytics:', error);
    }
  }

  // Cleanup expired tokens
  private cleanupExpiredTokens(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.resetTokens.entries()) {
        if (now > data.expires) {
          this.resetTokens.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  // Get authentication statistics
  async getAuthStats(): Promise<any> {
    try {
      const stats = {
        activeUsers: await this.getActiveUsersCount(),
        failedAttempts: this.loginAttempts.size,
        pendingResets: this.resetTokens.size,
        lastCleanup: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('Error getting auth stats:', error);
      return {};
    }
  }

  // Get active users count
  private async getActiveUsersCount(): Promise<number> {
    try {
      const { connection } = await dbManager.routeData('read', 'users');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await connection
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.lastActive} >= ${thirtyDaysAgo}`);

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
    }
  }
}

// Default configuration
const defaultAuthConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '7d',
  bcryptRounds: 12,
  maxLoginAttempts: 5,
  lockoutDuration: 15, // 15 minutes
  resetTokenExpiry: 10, // 10 minutes
  emailConfig: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  },
  twilioConfig: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  }
};

// Export enhanced auth instance
export const enhancedAuth = new EnhancedAuth(defaultAuthConfig); 