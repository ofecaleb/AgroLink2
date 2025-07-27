import { LRUCache } from 'lru-cache';

// Cache configuration for different data types
const cacheConfig = {
  // User data cache (5 minutes TTL, max 100 items)
  users: {
    max: 100,
    ttl: 1000 * 60 * 5, // 5 minutes
    updateAgeOnGet: true,
  },
  // Tontine data cache (2 minutes TTL, max 50 items)
  tontines: {
    max: 50,
    ttl: 1000 * 60 * 2, // 2 minutes
    updateAgeOnGet: true,
  },
  // Community posts cache (1 minute TTL, max 200 items)
  posts: {
    max: 200,
    ttl: 1000 * 60 * 1, // 1 minute
    updateAgeOnGet: true,
  },
  // Market prices cache (10 minutes TTL, max 100 items)
  prices: {
    max: 100,
    ttl: 1000 * 60 * 10, // 10 minutes
    updateAgeOnGet: true,
  },
  // Admin stats cache (30 seconds TTL, max 20 items)
  stats: {
    max: 20,
    ttl: 1000 * 30, // 30 seconds
    updateAgeOnGet: true,
  },
  // General cache (1 minute TTL, max 500 items)
  general: {
    max: 500,
    ttl: 1000 * 60 * 1, // 1 minute
    updateAgeOnGet: true,
  }
};

// Create cache instances
const caches = {
  users: new LRUCache<string, any>(cacheConfig.users),
  tontines: new LRUCache<string, any>(cacheConfig.tontines),
  posts: new LRUCache<string, any>(cacheConfig.posts),
  prices: new LRUCache<string, any>(cacheConfig.prices),
  stats: new LRUCache<string, any>(cacheConfig.stats),
  general: new LRUCache<string, any>(cacheConfig.general),
};

// Cache utility functions
export class CacheManager {
  // Get cached data
  static get<T>(cacheType: keyof typeof caches, key: string): T | undefined {
    return caches[cacheType].get(key) as T;
  }

  // Set cached data
  static set<T>(cacheType: keyof typeof caches, key: string, value: T): void {
    caches[cacheType].set(key, value);
  }

  // Delete cached data
  static delete(cacheType: keyof typeof caches, key: string): boolean {
    return caches[cacheType].delete(key);
  }

  // Clear entire cache
  static clear(cacheType: keyof typeof caches): void {
    caches[cacheType].clear();
  }

  // Clear all caches
  static clearAll(): void {
    Object.values(caches).forEach(cache => cache.clear());
  }

  // Get cache statistics
  static getStats() {
    return Object.entries(caches).reduce((stats, [name, cache]) => {
      stats[name] = {
        size: cache.size,
        max: cache.max,
        ttl: cache.ttl,
      };
      return stats;
    }, {} as Record<string, any>);
  }

  // Generate cache keys
  static keys = {
    user: (userId: number) => `user:${userId}`,
    userProfile: (userId: number) => `user_profile:${userId}`,
    tontine: (tontineId: number) => `tontine:${tontineId}`,
    userTontines: (userId: number) => `user_tontines:${userId}`,
    posts: (region: string, limit: number, userId?: number) => 
      `posts:${region}:${limit}:${userId || 'public'}`,
    post: (postId: number) => `post:${postId}`,
    prices: (region: string) => `prices:${region}`,
    adminStats: () => 'admin_stats',
    adminNotifications: () => 'admin_notifications',
    adminMetrics: () => 'admin_metrics',
    adminAutomationRules: () => 'admin_automation_rules',
  };

  // Invalidate related caches when data changes
  static invalidateUser(userId: number): void {
    this.delete('users', this.keys.user(userId));
    this.delete('users', this.keys.userProfile(userId));
    this.delete('tontines', this.keys.userTontines(userId));
    this.clear('posts'); // Clear posts cache as user data affects posts
  }

  static invalidateTontine(tontineId: number): void {
    this.delete('tontines', this.keys.tontine(tontineId));
    this.clear('tontines'); // Clear all tontine caches as relationships change
  }

  static invalidatePost(postId: number): void {
    this.delete('posts', this.keys.post(postId));
    this.clear('posts'); // Clear posts cache as post data affects lists
  }

  static invalidateAdminData(): void {
    this.delete('stats', this.keys.adminStats());
    this.delete('stats', this.keys.adminNotifications());
    this.delete('stats', this.keys.adminMetrics());
    this.delete('stats', this.keys.adminAutomationRules());
  }
}

// Cache middleware for Express routes
export const cacheMiddleware = (cacheType: keyof typeof caches, keyGenerator: (req: any) => string, ttl?: number) => {
  return (req: any, res: any, next: any) => {
    const key = keyGenerator(req);
    const cached = CacheManager.get(cacheType, key);
    
    if (cached) {
      return res.json(cached);
    }

    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data: any) {
      CacheManager.set(cacheType, key, data);
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache warming function for frequently accessed data
export const warmCache = async (storage: any) => {
  try {
    console.log('🔥 Warming up cache...');
    
    // Warm up admin stats
    const stats = await storage.getAdminStats();
    CacheManager.set('stats', CacheManager.keys.adminStats(), stats);
    
    // Warm up admin notifications
    const notifications = await storage.getAdminNotifications();
    CacheManager.set('stats', CacheManager.keys.adminNotifications(), notifications);
    
    // Warm up admin metrics
    const metrics = await storage.getAdminMetrics();
    CacheManager.set('stats', CacheManager.keys.adminMetrics(), metrics);
    
    // Warm up automation rules
    const automationRules = await storage.getAutomationRules({});
    CacheManager.set('stats', CacheManager.keys.adminAutomationRules(), automationRules);
    
    console.log('✅ Cache warmed up successfully');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
};

export default CacheManager; 