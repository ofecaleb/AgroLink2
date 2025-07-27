import { dbManager } from './database-config.js';
import { 
  users, 
  tontines, 
  tontineMembers, 
  tontinePayments, 
  marketPrices, 
  communityPosts, 
  communityComments,
  communityLikes,
  supportTickets,
  type User, 
  type InsertUser,
  type Tontine,
  type InsertTontine,
  type MarketPrice,
  type InsertMarketPrice,
  type CommunityPost,
  type InsertCommunityPost,
  type SupportTicket,
  type InsertSupportTicket
} from "../shared/schema.js";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";
import CacheManager from './cache.js';

// Data routing configuration
const DATA_ROUTING = {
  // Primary data (Neon/PostgreSQL)
  primary: ['users', 'tontines', 'tontine_members', 'tontine_payments', 'market_prices', 'community_posts', 'community_comments', 'community_likes', 'support_tickets'],
  
  // Real-time data (Firebase)
  realtime: ['market_prices', 'community_posts', 'user_sessions', 'notifications'],
  
  // Analytics data (Supabase)
  analytics: ['user_analytics', 'tontine_analytics', 'market_analytics', 'performance_metrics'],
  
  // Backup data (PocketBase)
  backup: ['users', 'tontines', 'market_prices', 'community_posts']
};

export class MultiDatabaseStorage {
  private dbManager = dbManager;

  // Route data to appropriate database
  private async routeData(operation: 'read' | 'write' | 'delete', dataType: string, data?: any) {
    const primaryDb = this.dbManager.getPrimary();
    
    // Always use primary database for core operations
    if (DATA_ROUTING.primary.includes(dataType)) {
      return { database: 'primary', connection: primaryDb };
    }
    
    // Route real-time data to Firebase
    if (DATA_ROUTING.realtime.includes(dataType)) {
      const firebase = this.dbManager.getConnection('firebase');
      if (firebase) {
        return { database: 'firebase', connection: firebase };
      }
    }
    
    // Route analytics to Supabase
    if (DATA_ROUTING.analytics.includes(dataType)) {
      const supabase = this.dbManager.getConnection('supabase');
      if (supabase) {
        return { database: 'supabase', connection: supabase };
      }
    }
    
    // Default to primary
    return { database: 'primary', connection: primaryDb };
  }

  // Enhanced user management with multi-database support
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Try primary database first
      const { connection } = await this.routeData('read', 'users');
      
      if (connection) {
        const [user] = await connection
          .select()
          .from(users)
          .where(eq(users.id, id));
        
        if (user) {
          // Cache the result
          CacheManager.set('users', `user:${id}`, user);
          return user;
        }
      }
      
      // Fallback to Firebase for real-time user data
      const firebase = this.dbManager.getConnection('firebase');
      if (firebase) {
        const doc = await firebase.collection('users').doc(id.toString()).get();
        if (doc.exists) {
          return { id: parseInt(doc.id), ...doc.data() } as User;
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Write to primary database
      const { connection } = await this.routeData('write', 'users');
      const [user] = await connection.insert(users).values(userData).returning();
      
      // Sync to other databases
      await this.syncUserToOtherDatabases(user);
      
      // Invalidate cache
      CacheManager.invalidateUser(user.id);
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Enhanced market prices with real-time capabilities
  async getMarketPrices(region: string): Promise<MarketPrice[]> {
    try {
      const cacheKey = CacheManager.keys.prices(region);
      const cached = CacheManager.get('prices', cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get from primary database
      const { connection } = await this.routeData('read', 'market_prices');
      const prices = await connection
        .select()
        .from(marketPrices)
        .where(eq(marketPrices.region, region))
        .orderBy(desc(marketPrices.createdAt));

      // Cache the result
      CacheManager.set('prices', cacheKey, prices);
      
      return prices;
    } catch (error) {
      console.error('Error getting market prices:', error);
      return [];
    }
  }

  async createMarketPrice(priceData: InsertMarketPrice): Promise<MarketPrice> {
    try {
      // Write to primary database
      const { connection } = await this.routeData('write', 'market_prices');
      const [price] = await connection.insert(marketPrices).values(priceData).returning();
      
      // Sync to Firebase for real-time updates
      await this.syncMarketPriceToFirebase(price);
      
      // Sync to Supabase for analytics
      await this.syncMarketPriceToSupabase(price);
      
      // Invalidate cache
      CacheManager.clear('prices');
      
      return price;
    } catch (error) {
      console.error('Error creating market price:', error);
      throw error;
    }
  }

  // Enhanced community posts with real-time features
  async getCommunityPosts(region: string, limit: number = 20, currentUserId?: number): Promise<any[]> {
    try {
      const cacheKey = CacheManager.keys.posts(region, limit, currentUserId);
      const cached = CacheManager.get('posts', cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get from primary database
      const { connection } = await this.routeData('read', 'community_posts');
      const posts = await connection
        .select({
          post: communityPosts,
          user: users,
          likesCount: sql<number>`(
            SELECT COUNT(*) FROM ${communityLikes} 
            WHERE ${communityLikes.postId} = ${communityPosts.id}
          )`,
          commentsCount: sql<number>`(
            SELECT COUNT(*) FROM ${communityComments} 
            WHERE ${communityComments.postId} = ${communityPosts.id}
          )`,
          hasLiked: currentUserId ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${communityLikes} 
            WHERE ${communityLikes.postId} = ${communityPosts.id} 
            AND ${communityLikes.userId} = ${currentUserId}
          )` : sql<boolean>`false`
        })
        .from(communityPosts)
        .innerJoin(users, eq(communityPosts.userId, users.id))
        .where(eq(communityPosts.region, region))
        .orderBy(desc(communityPosts.createdAt))
        .limit(limit);

      const formattedPosts = posts.map((p: any) => ({
        post: {
          ...p.post,
          likes: Number(p.likesCount),
          comments: Number(p.commentsCount),
          hasLiked: p.hasLiked
        },
        user: p.user
      }));

      // Cache the result
      CacheManager.set('posts', cacheKey, formattedPosts);
      
      return formattedPosts;
    } catch (error) {
      console.error('Error getting community posts:', error);
      return [];
    }
  }

  // Analytics methods using Supabase
  async getUserAnalytics(userId: number, period: string = '30d'): Promise<any> {
    try {
      const supabase = this.dbManager.getConnection('supabase');
      if (!supabase) {
        throw new Error('Supabase not available for analytics');
      }

      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - this.getPeriodDays(period) * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return [];
    }
  }

  async getMarketAnalytics(region: string, period: string = '30d'): Promise<any> {
    try {
      const supabase = this.dbManager.getConnection('supabase');
      if (!supabase) {
        throw new Error('Supabase not available for analytics');
      }

      const { data, error } = await supabase
        .rpc('get_market_analytics', {
          p_region: region,
          p_period: period
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting market analytics:', error);
      return [];
    }
  }

  // Backup methods using PocketBase
  async backupUserData(userId: number): Promise<boolean> {
    try {
      const pocketbase = this.dbManager.getConnection('pocketbase');
      if (!pocketbase) {
        throw new Error('PocketBase not available for backup');
      }

      // Get user data from primary database
      const user = await this.getUser(userId);
      if (!user) return false;

      // Backup to PocketBase
      await pocketbase.collection('users').upsert({
        id: user.id.toString(),
        ...user
      });

      console.log(`✅ User ${userId} backed up to PocketBase`);
      return true;
    } catch (error) {
      console.error('Error backing up user data:', error);
      return false;
    }
  }

  // Sync methods for cross-database consistency
  private async syncUserToOtherDatabases(user: User) {
    try {
      // Sync to Firebase for real-time features
      const firebase = this.dbManager.getConnection('firebase');
      if (firebase) {
        await firebase.collection('users').doc(user.id.toString()).set(user);
      }

      // Sync to PocketBase for backup
      const pocketbase = this.dbManager.getConnection('pocketbase');
      if (pocketbase) {
        await pocketbase.collection('users').upsert({
          id: user.id.toString(),
          ...user
        });
      }
    } catch (error) {
      console.error('Error syncing user to other databases:', error);
    }
  }

  private async syncMarketPriceToFirebase(price: MarketPrice) {
    try {
      const firebase = this.dbManager.getConnection('firebase');
      if (firebase) {
        await firebase.collection('market_prices').doc(price.id.toString()).set(price);
      }
    } catch (error) {
      console.error('Error syncing market price to Firebase:', error);
    }
  }

  private async syncMarketPriceToSupabase(price: MarketPrice) {
    try {
      const supabase = this.dbManager.getConnection('supabase');
      if (supabase) {
        await supabase.from('market_prices').upsert(price, { onConflict: 'id' });
      }
    } catch (error) {
      console.error('Error syncing market price to Supabase:', error);
    }
  }

  // Utility methods
  private getPeriodDays(period: string): number {
    const periods: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return periods[period] || 30;
  }

  // Health check
  async healthCheck() {
    return await this.dbManager.healthCheck();
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      const stats = {
        primary: await this.getPrimaryDatabaseStats(),
        firebase: await this.getFirebaseStats(),
        supabase: await this.getSupabaseStats(),
        pocketbase: await this.getPocketBaseStats()
      };

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  private async getPrimaryDatabaseStats() {
    try {
      const { connection } = await this.routeData('read', 'users');
      
      const userCount = await connection.select({ count: count() }).from(users);
      const tontineCount = await connection.select({ count: count() }).from(tontines);
      const priceCount = await connection.select({ count: count() }).from(marketPrices);
      
      return {
        users: userCount[0]?.count || 0,
        tontines: tontineCount[0]?.count || 0,
        market_prices: priceCount[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting primary database stats:', error);
      return {};
    }
  }

  private async getFirebaseStats() {
    try {
      const firebase = this.dbManager.getConnection('firebase');
      if (!firebase) return {};

      const usersSnapshot = await firebase.collection('users').get();
      const pricesSnapshot = await firebase.collection('market_prices').get();

      return {
        users: usersSnapshot.size,
        market_prices: pricesSnapshot.size
      };
    } catch (error) {
      console.error('Error getting Firebase stats:', error);
      return {};
    }
  }

  private async getSupabaseStats() {
    try {
      const supabase = this.dbManager.getConnection('supabase');
      if (!supabase) return {};

      const { count: userAnalytics } = await supabase
        .from('user_analytics')
        .select('*', { count: 'exact', head: true });

      const { count: marketAnalytics } = await supabase
        .from('market_analytics')
        .select('*', { count: 'exact', head: true });

      return {
        user_analytics: userAnalytics || 0,
        market_analytics: marketAnalytics || 0
      };
    } catch (error) {
      console.error('Error getting Supabase stats:', error);
      return {};
    }
  }

  private async getPocketBaseStats() {
    try {
      const pocketbase = this.dbManager.getConnection('pocketbase');
      if (!pocketbase) return {};

      const users = await pocketbase.collection('users').getFullList();
      const tontines = await pocketbase.collection('tontines').getFullList();

      return {
        users: users.length,
        tontines: tontines.length
      };
    } catch (error) {
      console.error('Error getting PocketBase stats:', error);
      return {};
    }
  }
}

// Export the enhanced storage instance
export const multiDbStorage = new MultiDatabaseStorage(); 