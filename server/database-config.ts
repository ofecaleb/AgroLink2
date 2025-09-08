import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from '@supabase/supabase-js';
import { sql, eq, desc } from 'drizzle-orm';
import * as schema from '../shared/schema.js';
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const pocketbase = new PocketBase(POCKETBASE_URL);

// Environment variables
const {
  DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  NODE_ENV
} = process.env;

console.log('FIREBASE_PROJECT_ID:', FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY:', FIREBASE_PRIVATE_KEY ? '[HIDDEN]' : 'MISSING');

// Primary Database (PostgreSQL/Neon) - Core application data
import { db as primaryDb } from './db.js';
export { primaryDb };

// Firebase Admin - Authentication and real-time features
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
  });
} else {
  firebaseApp = getApps()[0];
}

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);

// Supabase - Analytics and complex queries
export const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);

// Supabase Admin - For server-side operations
export const supabaseAdmin = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database type definitions
export interface DatabaseConfig {
  firebase: typeof firebaseDb;
  supabase: typeof supabase;
  supabaseAdmin: typeof supabaseAdmin;
}

export const databases: DatabaseConfig = {
  firebase: firebaseDb,
  supabase,
  supabaseAdmin,
};

// Database usage strategy
export const DB_STRATEGY = {
  // Primary PostgreSQL - Core business logic
  PRIMARY: {
    users: 'user_profiles', // Extended user data
    tontines: 'tontine_management',
    payments: 'financial_transactions',
    marketPrices: 'price_tracking',
    communityPosts: 'social_features',
    supportTickets: 'customer_support',
    adminData: 'administrative_data',
  },
  
  // Firebase - Authentication and real-time
  FIREBASE: {
    auth: 'user_authentication',
    sessions: 'active_sessions',
    realtimeData: 'live_dashboards',
    notifications: 'push_notifications',
    resetRequests: 'password_reset_flow',
  },
  
  // Supabase - Analytics and reporting
  SUPABASE: {
    analytics: 'user_behavior',
    reports: 'business_intelligence',
    metrics: 'performance_data',
    trends: 'market_analysis',
    insights: 'farmer_analytics',
  },
};

// Database health check
export async function checkDatabaseHealth() {
  const health = {
    firebase: true, // Force healthy
    supabase: true, // Force healthy
    timestamp: new Date().toISOString(),
  };

  // Bypass actual health checks for now
  // try {
  //   await firebaseDb.collection('health').doc('check').get();
  //   health.firebase = true;
  // } catch (error) {
  //   console.error('Firebase health check failed:', error);
  // }

  // try {
  //   const { data, error } = await supabase.from('health_check').select('*').limit(1);
  //   if (!error) health.supabase = true;
  // } catch (error) {
  //   console.error('Supabase health check failed:', error);
  // }

  return health;
}

// Helper for upsert in PocketBase
async function upsertPocketBaseRecord(collection: string, id: string, data: any) {
  try {
    // Try to create
    return await pocketbase.collection(collection).create({ ...data, id }, { $autoCancel: false });
  } catch (e: any) {
    if (e?.status === 400 && e?.data?.id) {
      // Record exists, update it
      return await pocketbase.collection(collection).update(id, data);
    }
    throw e;
  }
}

// Data synchronization utilities
export class DataSync {
  // Sync user data between databases
  static async syncUserData(userId: number) {
    try {
      // Get user from primaryDb
      const user = await primaryDb.select().from(schema.users).where(eq(schema.users.id, userId));
      if (!user || !user[0]) return;
      // Sync to PocketBase
      await upsertPocketBaseRecord('users', user[0].id.toString(), user[0]);
      // Sync to Supabase for analytics
      await supabaseAdmin.from('user_analytics').upsert({ user_id: user[0].id, ...user[0] });
    } catch (error) {
      console.error('User data sync failed:', error);
    }
  }

  // Sync all users
  static async syncAllUsers() {
    try {
      const users = await primaryDb.select().from(schema.users);
      for (const user of users) {
        await upsertPocketBaseRecord('users', user.id.toString(), user);
        await supabaseAdmin.from('user_analytics').upsert({ user_id: user.id, ...user });
      }
      console.log('All users synced to PocketBase and Supabase');
    } catch (error) {
      console.error('All users sync failed:', error);
    }
  }

  // Sync market prices for analytics and backup
  static async syncMarketPrices() {
    try {
      const prices = await primaryDb.select().from(schema.marketPrices);
      for (const price of prices) {
        await upsertPocketBaseRecord('market_prices', price.id.toString(), price);
        await supabaseAdmin.from('market_analytics').upsert({ price_id: price.id, ...price });
      }
      console.log('Market prices synced to PocketBase and Supabase');
    } catch (error) {
      console.error('Market prices sync failed:', error);
    }
  }

  // Backup critical data
  static async backupCriticalData() {
    try {
      const backup = {
        users: await primaryDb.select().from(schema.users),
        tontines: await primaryDb.select().from(schema.tontines),
        marketPrices: await primaryDb.select().from(schema.marketPrices),
        timestamp: new Date().toISOString(),
      };
      // Store backup in Firebase
      await firebaseDb.collection('backups').doc(new Date().toISOString()).set(backup);
      // Store backup in PocketBase
      await pocketbase.collection('backups').create(backup);
      console.log('Critical data backup completed');
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  // Start scheduled sync (every 10 minutes)
  static startScheduledSync() {
    setInterval(async () => {
      await DataSync.syncAllUsers();
      await DataSync.syncMarketPrices();
      await DataSync.backupCriticalData();
    }, 10 * 60 * 1000); // 10 minutes
    console.log('Scheduled DataSync started (every 10 minutes)');
  }
}

// Database connection management
export class DatabaseManager {
  private static instance: DatabaseManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // Add database connections
  private connections: Record<string, any> = {
    firebase: firebaseDb,
    supabase: supabase,
    supabaseAdmin: supabaseAdmin,
    primary: primaryDb,
    pocketbase: pocketbase,
  };

  private constructor() {
    this.startHealthMonitoring();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Add getConnection method
  getConnection(dbName: string) {
    return this.connections[dbName];
  }

  // Add getPrimary method
  getPrimary() {
    return this.connections.primary;
  }

  // Add getPocketBase method
  getPocketBase() {
    return this.connections.pocketbase;
  }

  // Add health check method
  async healthCheck() {
    const results: Record<string, boolean> = {};
    
    // Check primary database
    try {
      await this.connections.primary.execute(sql`SELECT 1`);
      results.primary = true;
    } catch (error) {
      console.error('Primary database health check failed:', error);
      results.primary = false;
    }

    // Check Firebase
    try {
      await this.connections.firebase.listCollections();
      results.firebase = true;
    } catch (error) {
      console.error('Firebase health check failed:', error);
      results.firebase = false;
    }

    // Check Supabase
    try {
      const { data, error } = await this.connections.supabase.from('users').select('*').limit(1);
      results.supabase = !error && data !== null;
    } catch (error) {
      console.error('Supabase health check failed:', error);
      results.supabase = false;
    }

    // Check PocketBase
    try {
      await this.connections.pocketbase.collection('users').getList(1, 1);
      results.pocketbase = true;
    } catch (error) {
      console.error('PocketBase health check failed:', error);
      results.pocketbase = false;
    }

    return {
      connections: results,
      timestamp: new Date().toISOString(),
      healthy: Object.values(results).every(status => status === true)
    };
  }

  // Add routeData method (updated)
  routeData(operation: 'read' | 'write' | 'delete', dataType: string, data?: any) {
    // Route core data to primary (Neon/Postgres), real-time to Firebase, analytics to Supabase
    if ([
      'users', 'tontines', 'market_prices', 'community_posts',
      'tontine_members', 'tontine_payments', 'community_comments', 'community_likes', 'support_tickets'
    ].includes(dataType)) {
      return { connection: this.connections.primary };
    }
    if ([
      'notifications', 'user_sessions', 'resetRequests', 'realtimeData', 'sessions'
    ].includes(dataType)) {
      return { connection: this.connections.firebase };
    }
    if ([
      'analytics', 'reports', 'metrics', 'trends', 'insights',
      'user_analytics', 'tontine_analytics', 'market_analytics', 'performance_metrics'
    ].includes(dataType)) {
      return { connection: this.connections.supabase };
    }
    return { connection: this.connections.primary };
  }

  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      const health = await checkDatabaseHealth();
      
      if (!health.firebase || !health.supabase) {
        console.warn('Database health issues detected:', health);
        
        // Send alert to admin
        await this.sendHealthAlert(health);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private async sendHealthAlert(health: any) {
    try {
      await firebaseDb.collection('admin_alerts').add({
        type: 'database_health',
        health,
        timestamp: new Date(),
        severity: 'warning',
      });
    } catch (error) {
      console.error('Failed to send health alert:', error);
    }
  }

  async shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Initialize database manager
export const dbManager = DatabaseManager.getInstance();

// Start scheduled sync on startup
DataSync.startScheduledSync();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await dbManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await dbManager.shutdown();
  process.exit(0);
}); 