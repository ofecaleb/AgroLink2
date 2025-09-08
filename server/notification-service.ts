import { firebaseDb, primaryDb, supabaseAdmin } from './database-config.js';
import { users, adminNotifications } from '../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AdminNotification {
  id: string;
  adminId: string;
  type: 'system' | 'user' | 'security' | 'performance';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  isRead: boolean;
  createdAt: Date;
  actionRequired: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  message: string;
  variables: string[];
  isActive: boolean;
}

export class NotificationService {
  // Send notification to user
  static async sendNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: any,
    expiresAt?: Date
  ): Promise<Notification> {
    try {
      // Store in Firebase for real-time delivery
      const notification = await firebaseDb.collection('notifications').add({
        userId,
        type,
        title,
        message,
        data,
        isRead: false,
        createdAt: new Date(),
        expiresAt,
      });

      // Store in primary database for persistence
      const dbNotification = await primaryDb
        .insert(adminNotifications)
        .values({
          adminId: parseInt(userId),
          type: type as any,
          title,
          message,
          severity: this.mapTypeToSeverity(type),
          data: data ? JSON.stringify(data) : null,
          isRead: false,
          actionRequired: false,
        })
        .returning();

      // Log analytics
      await supabaseAdmin.from('notification_analytics').insert({
        user_id: userId,
        notification_type: type,
        title,
        timestamp: new Date().toISOString(),
      });

      return {
        id: notification.id,
        userId,
        type,
        title,
        message,
        data,
        isRead: false,
        createdAt: new Date(),
        expiresAt,
      };
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  // Send admin notification
  static async sendAdminNotification(
    adminId: string,
    type: AdminNotification['type'],
    title: string,
    message: string,
    severity: AdminNotification['severity'] = 'medium',
    data?: any,
    actionRequired: boolean = false
  ): Promise<AdminNotification> {
    try {
      // Store in Firebase for real-time delivery
      const notification = await firebaseDb.collection('admin_notifications').add({
        adminId,
        type,
        title,
        message,
        severity,
        data,
        isRead: false,
        createdAt: new Date(),
        actionRequired,
      });

      // Store in primary database
      const dbNotification = await primaryDb
        .insert(adminNotifications)
        .values({
          adminId: parseInt(adminId),
          type: type as any,
          title,
          message,
          severity,
          data: data ? JSON.stringify(data) : null,
          isRead: false,
          actionRequired,
        })
        .returning();

      // Log analytics
      await supabaseAdmin.from('admin_notification_analytics').insert({
        admin_id: adminId,
        notification_type: type,
        severity,
        title,
        timestamp: new Date().toISOString(),
      });

      return {
        id: notification.id,
        adminId,
        type,
        title,
        message,
        severity,
        data,
        isRead: false,
        createdAt: new Date(),
        actionRequired,
      };
    } catch (error) {
      console.error('Send admin notification error:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      // Get from Firebase for real-time data
      const notifications = await firebaseDb
        .collection('notifications')
        .where('userId', '==', userId)
        .where('expiresAt', '>', new Date())
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return notifications.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        type: doc.data().type,
        title: doc.data().title,
        message: doc.data().message,
        data: doc.data().data,
        isRead: doc.data().isRead,
        createdAt: doc.data().createdAt.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
      }));
    } catch (error) {
      console.error('Get user notifications error:', error);
      return [];
    }
  }

  // Get admin notifications
  static async getAdminNotifications(adminId: string, limit: number = 50): Promise<AdminNotification[]> {
    try {
      // Get from Firebase for real-time data
      const notifications = await firebaseDb
        .collection('admin_notifications')
        .where('adminId', '==', adminId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return notifications.docs.map(doc => ({
        id: doc.id,
        adminId: doc.data().adminId,
        type: doc.data().type,
        title: doc.data().title,
        message: doc.data().message,
        severity: doc.data().severity,
        data: doc.data().data,
        isRead: doc.data().isRead,
        createdAt: doc.data().createdAt.toDate(),
        actionRequired: doc.data().actionRequired,
      }));
    } catch (error) {
      console.error('Get admin notifications error:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Update in Firebase
      await firebaseDb
        .collection('notifications')
        .doc(notificationId)
        .update({ isRead: true });

      // Update in primary database
      await primaryDb
        .update(adminNotifications)
        .set({ isRead: true })
        .where(eq(adminNotifications.id, parseInt(notificationId)));

      return true;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return false;
    }
  }

  // Mark admin notification as read
  static async markAdminNotificationAsRead(notificationId: string, adminId: string): Promise<boolean> {
    try {
      // Update in Firebase
      await firebaseDb
        .collection('admin_notifications')
        .doc(notificationId)
        .update({ isRead: true });

      // Update in primary database
      await primaryDb
        .update(adminNotifications)
        .set({ isRead: true })
        .where(eq(adminNotifications.id, parseInt(notificationId)));

      return true;
    } catch (error) {
      console.error('Mark admin notification as read error:', error);
      return false;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      // Delete from Firebase
      await firebaseDb
        .collection('notifications')
        .doc(notificationId)
        .delete();

      // Delete from primary database
      await primaryDb
        .delete(adminNotifications)
        .where(eq(adminNotifications.id, parseInt(notificationId)));

      return true;
    } catch (error) {
      console.error('Delete notification error:', error);
      return false;
    }
  }

  // Send bulk notifications
  static async sendBulkNotifications(
    userIds: string[],
    type: Notification['type'],
    title: string,
    message: string,
    data?: any
  ): Promise<number> {
    try {
      const batch = firebaseDb.batch();
      let successCount = 0;

      for (const userId of userIds) {
        try {
          const notificationRef = firebaseDb.collection('notifications').doc();
          batch.set(notificationRef, {
            userId,
            type,
            title,
            message,
            data,
            isRead: false,
            createdAt: new Date(),
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to add notification for user ${userId}:`, error);
        }
      }

      await batch.commit();

      // Log analytics
      await supabaseAdmin.from('bulk_notification_analytics').insert({
        user_count: successCount,
        notification_type: type,
        title,
        timestamp: new Date().toISOString(),
      });

      return successCount;
    } catch (error) {
      console.error('Error in sendBulkNotifications:', error);
      return 0;
    }
  }

  // Send system notification to all active users
  static async sendSystemNotification(
    type: Notification['type'],
    title: string,
    message: string,
    data?: any
  ): Promise<number> {
    try {
      // Get all active users
      const activeUsers = await primaryDb.query.users.findMany({
        where: eq(users.isActive, true),
      });

      const userIds = activeUsers.map((user: { id: number }) => user.id.toString());
      return await this.sendBulkNotifications(userIds, type, title, message, data);
    } catch (error) {
      console.error('Send system notification error:', error);
      return 0;
    }
  }

  // Get notification templates
  static async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    try {
      const templates = await firebaseDb
        .collection('notification_templates')
        .where('isActive', '==', true)
        .get();

      return templates.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        type: doc.data().type,
        title: doc.data().title,
        message: doc.data().message,
        variables: doc.data().variables || [],
        isActive: doc.data().isActive,
      }));
    } catch (error) {
      console.error('Get notification templates error:', error);
      return [];
    }
  }

  // Create notification template
  static async createNotificationTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    try {
      const doc = await firebaseDb.collection('notification_templates').add({
        ...template,
        createdAt: new Date(),
      });

      return {
        id: doc.id,
        ...template,
      };
    } catch (error) {
      console.error('Create notification template error:', error);
      throw error;
    }
  }

  // Send notification using template
  static async sendNotificationFromTemplate(
    userId: string,
    templateId: string,
    variables: { [key: string]: string }
  ): Promise<Notification | null> {
    try {
      const templateDoc = await firebaseDb
        .collection('notification_templates')
        .doc(templateId)
        .get();

      if (!templateDoc.exists) {
        throw new Error('Template not found');
      }

      const template = templateDoc.data() as NotificationTemplate | undefined;
      if (!template) {
        throw new Error('Invalid template data');
      }

      let title = template.title;
      let message = template.message;

      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}}`, 'g');
        title = title.replace(regex, value);
        message = message.replace(regex, value);
      });

      return await this.sendNotification(
        userId,
        template.type as Notification['type'],
        title,
        message,
        { templateId, variables }
      );
    } catch (error) {
      console.error('Send notification from template error:', error);
      return null;
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const expiredNotifications = await firebaseDb
        .collection('notifications')
        .where('expiresAt', '<', new Date())
        .get();

      const batch = firebaseDb.batch();
      expiredNotifications.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return expiredNotifications.docs.length;
    } catch (error) {
      console.error('Cleanup expired notifications error:', error);
      return 0;
    }
  }

  // Get notification analytics
  static async getNotificationAnalytics() {
    try {
      // Use a raw SQL query for grouping since Supabase's query builder doesn't support GROUP BY directly
      const { data, error } = await supabaseAdmin.rpc('get_notification_analytics');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get notification analytics error:', error);
      return [];
    }
  }

  // Get notification statistics
  static async getNotificationStats(): Promise<{
    totalNotifications: number;
    byType: Array<{ notification_type: string; count: number }>;
    timestamp: string;
  }> {
    try {
      // Use the RPC function for analytics instead of direct query with group
      const { data: stats, error } = await supabaseAdmin
        .rpc('get_notification_stats', {
          days: 30
        });

      if (error) throw error;

      return {
        totalNotifications: stats?.reduce((sum: number, stat: any) => sum + (stat.count || 0), 0) || 0,
        byType: stats || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get notification stats error:', error);
      return {
        totalNotifications: 0,
        byType: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Map notification type to severity
  private static mapTypeToSeverity(type: Notification['type']): AdminNotification['severity'] {
    switch (type) {
      case 'error':
        return 'critical';
      case 'warning':
        return 'high';
      case 'success':
        return 'low';
      default:
        return 'medium';
    }
  }
}

// Schedule cleanup tasks
setInterval(() => {
  NotificationService.cleanupExpiredNotifications();
}, 60 * 60 * 1000); // Run every hour 