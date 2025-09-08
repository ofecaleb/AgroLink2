import express from 'express';
import { multiDbStorage } from './multi-db-storage.js';
import { enhancedAuth } from './enhanced-auth.js';
import { dbManager } from './database-config.js';
import CacheManager from './cache.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  users, 
  tontines, 
  tontineMembers, 
  tontinePayments, 
  marketPrices, 
  communityPosts, 
  communityComments,
  communityLikes,
  supportTickets
} from '../shared/schema.js';

const router = express.Router();

// Enhanced Authentication Routes
router.post('/auth/register', async (req, res) => {
  try {
    const { phone, password, pin, email, name, region } = req.body;

    if (!phone || !password || !pin || !email || !name || !region) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await enhancedAuth.registerUser({
      phone,
      password,
      pin,
      email,
      name,
      region,
      role: 'farmer'
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        email: result.user.email,
        role: result.user.role
      },
      token: result.token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { phone, password, pin } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const result = await enhancedAuth.loginUser(phone, password, pin);

    if (result.requiresPin) {
      return res.status(200).json({
        message: 'PIN required',
        requiresPin: true,
        user: {
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          email: result.user.email,
          role: result.user.role
        }
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        email: result.user.email,
        role: result.user.role
      },
      token: result.token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

router.post('/auth/reset/initiate', async (req, res) => {
  try {
    const { phone, type, method } = req.body;

    if (!phone || !type || !method) {
      return res.status(400).json({ error: 'Phone, type, and method are required' });
    }

    if (!['password', 'pin'].includes(type)) {
      return res.status(400).json({ error: 'Type must be password or pin' });
    }

    if (!['email', 'whatsapp'].includes(method)) {
      return res.status(400).json({ error: 'Method must be email or whatsapp' });
    }

    const result = await enhancedAuth.initiateReset(phone, type, method);

    res.json(result);
  } catch (error: any) {
    console.error('Reset initiation error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/auth/reset/complete', async (req, res) => {
  try {
    const { phone, type, token, newValue } = req.body;

    if (!phone || !type || !token || !newValue) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['password', 'pin'].includes(type)) {
      return res.status(400).json({ error: 'Type must be password or pin' });
    }

    const result = await enhancedAuth.completeReset(phone, type, token, newValue);

    res.json(result);
  } catch (error: any) {
    console.error('Reset completion error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Enhanced Market Prices with Real-time Features
router.get('/market-prices', async (req, res) => {
  try {
    const region = req.query.region as string || 'all';
    
    // Check cache first
    const cacheKey = CacheManager.keys.prices(region);
    const cached = CacheManager.get('prices', cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get from multi-database storage
    const prices = await multiDbStorage.getMarketPrices(region);

    // Cache the result
    CacheManager.set('prices', cacheKey, prices);

    res.json(prices);
  } catch (error) {
    console.error('Error getting market prices:', error);
    res.status(500).json({ error: 'Failed to get market prices' });
  }
});

router.post('/market-prices', async (req, res) => {
  try {
    const { crop, price, region, unit } = req.body;
    const userId = (req as any).user?.userId;

    if (!crop || !price || !region || !unit) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const priceData = {
      crop,
      price: parseFloat(price).toString(), // Convert to string for decimal type
      region,
      unit,
      submittedBy: userId || 1, // Use submittedBy instead of userId
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newPrice = await multiDbStorage.createMarketPrice(priceData);

    res.status(201).json(newPrice);
  } catch (error) {
    console.error('Error creating market price:', error);
    res.status(500).json({ error: 'Failed to create market price' });
  }
});

// Enhanced Community Posts with Real-time Features
router.get('/community/posts', async (req, res) => {
  try {
    const region = req.query.region as string || 'all';
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = (req as any).user?.userId;

    // Check cache first
    const cacheKey = CacheManager.keys.posts(region, limit, userId);
    const cached = CacheManager.get('posts', cacheKey);
    
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get from multi-database storage
    const posts = await multiDbStorage.getCommunityPosts(region, limit, userId);

    // Cache the result
    CacheManager.set('posts', cacheKey, posts);

    res.json(posts);
  } catch (error) {
    console.error('Error getting community posts:', error);
    res.status(500).json({ error: 'Failed to get community posts' });
  }
});

router.post('/community/posts', async (req, res) => {
  try {
    const { content, region } = req.body;
    const userId = (req as any).user?.userId;

    if (!content || !region) {
      return res.status(400).json({ error: 'Content and region are required' });
    }

    const postData = {
      userId: userId || 1,
      content,
      region,
      createdAt: new Date()
    };

    const { connection } = await dbManager.routeData('write', 'community_posts');
    const [newPost] = await connection.insert(communityPosts).values(postData).returning();

    // Sync to Firebase for real-time updates
    const firebase = dbManager.getConnection('firebase');
    if (firebase) {
      await firebase.collection('community_posts').doc(newPost.id.toString()).set(newPost);
    }

    // Clear cache
    CacheManager.clear('posts');

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({ error: 'Failed to create community post' });
  }
});

// Enhanced Analytics Routes
router.get('/analytics/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const period = req.query.period as string || '30d';

    const analytics = await multiDbStorage.getUserAnalytics(userId, period);

    res.json(analytics);
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

router.get('/analytics/market/:region', async (req, res) => {
  try {
    const region = req.params.region;
    const period = req.query.period as string || '30d';

    const analytics = await multiDbStorage.getMarketAnalytics(region, period);

    res.json(analytics);
  } catch (error) {
    console.error('Error getting market analytics:', error);
    res.status(500).json({ error: 'Failed to get market analytics' });
  }
});

// Enhanced Admin Routes with Multi-Database Support
router.get('/admin/stats', async (req, res) => {
  try {
    // Get stats from multiple databases
    const [primaryStats, authStats, dbStats] = await Promise.all([
      multiDbStorage.getDatabaseStats(),
      enhancedAuth.getAuthStats(),
      dbManager.healthCheck()
    ]);

    const stats = {
      primary: primaryStats,
      auth: authStats,
      databases: dbStats,
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

router.get('/admin/backup/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const success = await multiDbStorage.backupUserData(userId);

    if (success) {
      res.json({ message: 'User data backed up successfully' });
    } else {
      res.status(500).json({ error: 'Failed to backup user data' });
    }
  } catch (error) {
    console.error('Error backing up user data:', error);
    res.status(500).json({ error: 'Failed to backup user data' });
  }
});

// Enhanced Health Check
router.get('/health', async (req, res) => {
  try {
    const health = await dbManager.healthCheck();
    
    const isHealthy = Object.values(health.connections).some(status => status);
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      databases: health.connections,
      timestamp: health.timestamp
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// Enhanced Performance Monitoring
router.get('/performance/stats', async (req, res) => {
  try {
    const cacheStats = CacheManager.getStats();
    const dbStats = await dbManager.healthCheck();
    
    const performanceStats = {
      cache: cacheStats,
      databases: dbStats.connections,
      timestamp: new Date().toISOString()
    };

    res.json(performanceStats);
  } catch (error) {
    console.error('Error getting performance stats:', error);
    res.status(500).json({ error: 'Failed to get performance stats' });
  }
});

// Middleware for authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = enhancedAuth.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
};

// Apply authentication middleware to protected routes
router.use('/admin', authenticateToken);
router.use('/analytics', authenticateToken);

export default router; 