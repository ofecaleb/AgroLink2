import { firebaseAuth, firebaseDb, primaryDb, supabaseAdmin } from './database-config.js';
import { users, userSessions } from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  email?: string;
  phone: string;
  name: string;
  role: string;
  isActive: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsed: Date;
}

export interface ResetRequest {
  id: string;
  userId: string;
  type: 'password' | 'pin';
  method: 'email' | 'whatsapp';
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export class AuthService {
  // User authentication
  static async authenticateUser(phone: string, password: string): Promise<AuthUser | null> {
    try {
      // Check primary database first
      const user = await primaryDb.query.users.findFirst({
        where: eq(users.phone, phone),
      });

      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      // Update last active
      await primaryDb
        .update(users)
        .set({ lastActive: new Date() })
        .where(eq(users.id, user.id));

      // Sync with Firebase
      await this.syncUserToFirebase(user);

      return {
        id: user.id.toString(),
        email: user.email || undefined,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  // Create user session
  static async createSession(userId: string): Promise<AuthSession> {
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await primaryDb
      .insert(userSessions)
      .values({
        userId: parseInt(userId),
        sessionToken,
        expiresAt,
        lastUsed: new Date(),
      })
      .returning();

    // Store session in Firebase for real-time features
    await firebaseDb.collection('sessions').doc(sessionToken).set({
      userId,
      expiresAt,
      lastUsed: new Date(),
    });

    return {
      id: session[0].id.toString(),
      userId,
      sessionToken,
      expiresAt: session[0].expiresAt,
      createdAt: session[0].createdAt,
      lastUsed: session[0].lastUsed,
    };
  }

  // Validate session
  static async validateSession(sessionToken: string): Promise<AuthUser | null> {
    try {
      // Check primary database
      const session = await primaryDb.query.userSessions.findFirst({
        where: and(
          eq(userSessions.sessionToken, sessionToken),
          eq(userSessions.expiresAt, new Date())
        ),
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Update last used
      await primaryDb
        .update(userSessions)
        .set({ lastUsed: new Date() })
        .where(eq(userSessions.id, session.id));

      // Get user data
      const user = await primaryDb.query.users.findFirst({
        where: eq(users.id, session.userId),
      });

      if (!user || !user.isActive) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email || undefined,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // Create reset request
  static async createResetRequest(
    userId: string,
    type: 'password' | 'pin',
    method: 'email' | 'whatsapp'
  ): Promise<ResetRequest> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store in Firebase for real-time access
    const resetRequest = await firebaseDb.collection('resetRequests').add({
      userId,
      type,
      method,
      code,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
    });

    // Also store in primary database for backup
    await primaryDb.insert(userSessions).values({
      userId: parseInt(userId),
      sessionToken: `reset_${resetRequest.id}`,
      expiresAt,
      lastUsed: new Date(),
    });

    return {
      id: resetRequest.id,
      userId,
      type,
      method,
      code,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
    };
  }

  // Verify reset code
  static async verifyResetCode(
    userId: string,
    code: string,
    type: 'password' | 'pin'
  ): Promise<boolean> {
    try {
      const resetRequest = await firebaseDb
        .collection('resetRequests')
        .where('userId', '==', userId)
        .where('type', '==', type)
        .where('code', '==', code)
        .where('isUsed', '==', false)
        .where('expiresAt', '>', new Date())
        .limit(1)
        .get();

      if (resetRequest.empty) {
        return false;
      }

      const request = resetRequest.docs[0];
      
      // Mark as used
      await firebaseDb
        .collection('resetRequests')
        .doc(request.id)
        .update({ isUsed: true });

      return true;
    } catch (error) {
      console.error('Reset code verification error:', error);
      return false;
    }
  }

  // Reset password/PIN
  static async resetCredentials(
    userId: string,
    newPassword: string,
    type: 'password' | 'pin'
  ): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await primaryDb
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, parseInt(userId)));

      // Sync with Firebase
      await firebaseDb.collection('user_profiles').doc(userId).update({
        password: hashedPassword,
        updatedAt: new Date(),
      });

      // Log analytics
      await supabaseAdmin.from('auth_analytics').insert({
        user_id: userId,
        action: `reset_${type}`,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  }

  // Sync user data to Firebase
  private static async syncUserToFirebase(user: any) {
    try {
      await firebaseDb.collection('user_profiles').doc(user.id.toString()).set({
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSync: new Date(),
      });
    } catch (error) {
      console.error('Firebase sync error:', error);
    }
  }

  // Get user analytics
  static async getUserAnalytics(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Analytics fetch error:', error);
      return [];
    }
  }

  // Log user activity
  static async logActivity(userId: string, action: string, details?: any) {
    try {
      // Log to Supabase analytics
      await supabaseAdmin.from('user_analytics').insert({
        user_id: userId,
        action,
        details,
        timestamp: new Date().toISOString(),
      });

      // Log to Firebase for real-time monitoring
      await firebaseDb.collection('user_activities').add({
        userId,
        action,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Activity logging error:', error);
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions() {
    try {
      const expiredSessions = await primaryDb.query.userSessions.findMany({
        where: eq(userSessions.expiresAt, new Date()),
      });

      for (const session of expiredSessions) {
        // Delete from primary database
        await primaryDb
          .delete(userSessions)
          .where(eq(userSessions.id, session.id));

        // Delete from Firebase
        await firebaseDb
          .collection('sessions')
          .doc(session.sessionToken)
          .delete();
      }

      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  // Get user sessions
  static async getUserSessions(userId: string): Promise<AuthSession[]> {
    try {
      const sessions = await primaryDb.query.userSessions.findMany({
        where: eq(userSessions.userId, parseInt(userId)),
        orderBy: desc(userSessions.lastUsed),
      });

      return sessions.map(session => ({
        id: session.id.toString(),
        userId: session.userId.toString(),
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastUsed: session.lastUsed,
      }));
    } catch (error) {
      console.error('Get sessions error:', error);
      return [];
    }
  }

  // Revoke session
  static async revokeSession(sessionToken: string): Promise<boolean> {
    try {
      // Delete from primary database
      await primaryDb
        .delete(userSessions)
        .where(eq(userSessions.sessionToken, sessionToken));

      // Delete from Firebase
      await firebaseDb
        .collection('sessions')
        .doc(sessionToken)
        .delete();

      return true;
    } catch (error) {
      console.error('Session revocation error:', error);
      return false;
    }
  }
}

// Schedule cleanup tasks
setInterval(() => {
  AuthService.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Run every hour 