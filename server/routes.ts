import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage.js";
import { adminAutomation } from "./admin-automation.js";
import { insertUserSchema, insertTontineSchema, insertMarketPriceSchema, insertCommunityPostSchema, insertTontinePaymentSchema, loginSchema, changePasswordSchema, setPasswordSchema, type User } from "../shared/schema.js";
import { z } from "zod";
import path from "path";
import fs from "fs";
import express from "express";
import multer from "multer";
import { eq } from "drizzle-orm";
import CacheManager, { cacheMiddleware, warmCache } from "./cache.js";
// Add this at the top of the file for ESM __dirname compatibility
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const session = await storage.getSession(token);
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Super admin authentication middleware
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  next();
};

const upload = multer();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Cache warming on server start
  setTimeout(() => {
    warmCache(storage);
  }, 5000); // Warm cache 5 seconds after server start

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this phone number' });
      }

      // Hash the PIN
      const hashedPin = await bcrypt.hash(userData.pin, 10);
      
      // Hash the password if provided
      let hashedPassword = undefined;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await storage.createUser({
        ...userData,
        pin: hashedPin,
        password: hashedPassword
      });

      // Remove sensitive data from response
      const { pin, password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('LOGIN DEBUG: req.body =', req.body); // Debug log
      // Accept either email/password or phone/pin
      const { email, password, phone, pin } = req.body;
      let user;
      if (email && password) {
        // Try Firebase or Supabase user fetch here if needed
        user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await bcrypt.compare(password, user.password || '');
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } else if (phone && pin) {
        user = await storage.getUserByPhone(phone);
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await bcrypt.compare(pin, user.pin || '');
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } else {
        return res.status(400).json({ error: 'Missing credentials' });
      }
      // Create session
      const sessionToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30m' });
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await storage.createSession(user.id, sessionToken, expiresAt);
      await storage.updateUserLastActive(user.id);
      const { pin: _, password: __, ...userResponse } = user;
      res.json({ user: userResponse, token: sessionToken });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteSession(req.sessionToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // User routes with caching
  app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      await storage.updateUserLastActive(req.user.id);
      const { pin, ...userResponse } = req.user;
      res.json(userResponse);
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const { name, email, country, region, language, currency, profilePicture, avatar } = req.body;
      
      // Only allow updating certain fields
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (country !== undefined) updateData.country = country;
      if (region !== undefined) updateData.region = region;
      if (language !== undefined) updateData.language = language;
      if (currency !== undefined) updateData.currency = currency;
      if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
      if (avatar !== undefined) updateData.avatar = avatar;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      // Invalidate user cache
      CacheManager.invalidateUser(req.user.id);
      
      const { pin, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Tontine routes with caching
  app.get("/api/tontines", authenticateToken, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.userTontines(req.user.id);
      const cached = CacheManager.get('tontines', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const tontines = await storage.getTontinesByUser(req.user.id);
      CacheManager.set('tontines', cacheKey, tontines);
      res.json(tontines);
    } catch (error) {
      console.error('Get tontines error:', error);
      res.status(500).json({ error: 'Failed to get tontines' });
    }
  });

  app.post("/api/tontines", authenticateToken, async (req: any, res) => {
    try {
      const tontineData = insertTontineSchema.parse(req.body);
      
      const tontine = await storage.createTontine({
        ...tontineData,
        leaderId: req.user.id,
        status: 'pending'
      });

      // Invalidate tontine caches
      CacheManager.invalidateTontine(tontine.id);
      CacheManager.clear('tontines');
      
      res.status(201).json(tontine);
    } catch (error) {
      console.error('Create tontine error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Failed to create tontine' });
    }
  });

  // Community posts with caching
  app.get("/api/community/posts", authenticateToken, async (req: any, res) => {
    try {
      const region = (req.query.region as string) || req.user.region || 'all';
      const limit = parseInt(req.query.limit as string) || 20;
      const cacheKey = CacheManager.keys.posts(region, limit, req.user.id);
      const cached = CacheManager.get('posts', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const posts = await storage.getCommunityPosts(region, limit, req.user.id);
      CacheManager.set('posts', cacheKey, posts);
      res.json(posts);
    } catch (error) {
      console.error('Get community posts error:', error);
      res.status(500).json({ error: 'Failed to get community posts' });
    }
  });

  app.post("/api/community/posts", authenticateToken, async (req: any, res) => {
    try {
      const postData = insertCommunityPostSchema.parse(req.body);
      
      const post = await storage.createCommunityPost({
        ...postData,
        userId: req.user.id
      });

      // Invalidate posts cache
      CacheManager.clear('posts');
      
      res.status(201).json(post);
    } catch (error) {
      console.error('Create community post error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Failed to create community post' });
    }
  });

  // Market prices with caching
  app.get("/api/market/prices", async (req, res) => {
    try {
      let region = req.query.region;
      if (Array.isArray(region)) region = region[0];
      region = typeof region === 'string' ? region : 'all';
      const cacheKey = CacheManager.keys.prices(region as string);
      const cached = CacheManager.get('prices', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const prices = await storage.getMarketPrices(region as string);
      CacheManager.set('prices', cacheKey, prices);
      res.json(prices);
    } catch (error) {
      console.error('Get market prices error:', error);
      res.status(500).json({ error: 'Failed to get market prices' });
    }
  });

  // Admin routes with aggressive caching
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminStats();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const totalUsers = await storage.getUserCount();
      const activeTontines = await storage.getActiveTontineCount();
      const totalContributions = await storage.getTotalContributions();
      
      // Calculate revenue (2% fee on contributions)
      const totalRevenue = Math.floor(totalContributions * 0.02);
      
      // Get premium users count
      const allUsers = await storage.searchUsers('');
      const premiumUsers = allUsers.filter((user: any) => user.plan === 'premium' || user.plan === 'enterprise').length;
      
      const stats = {
        totalUsers,
        activeTontines,
        totalRevenue,
        premiumUsers,
        totalContributions
      };

      CacheManager.set('stats', cacheKey, stats);
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Failed to get admin stats' });
    }
  });

  app.get("/api/admin/notifications", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminNotifications();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const notifications = await storage.getAdminNotifications(req.user.id);
      CacheManager.set('stats', cacheKey, notifications);
      res.json(notifications);
    } catch (error) {
      console.error('Get admin notifications error:', error);
      res.status(500).json({ error: 'Failed to get admin notifications' });
    }
  });

  app.get("/api/admin/metrics", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminMetrics();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const { metricType, period, startDate, endDate } = req.query;
      const metrics = await storage.getSystemMetrics({
        metricType: metricType as string,
        period: period as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      CacheManager.set('stats', cacheKey, metrics);
      res.json(metrics);
    } catch (error) {
      console.error('Get system metrics error:', error);
      res.status(500).json({ error: 'Failed to get system metrics' });
    }
  });

  app.get("/api/admin/automation/rules", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminAutomationRules();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const rules = await storage.getAutomationRules({});
      CacheManager.set('stats', cacheKey, rules);
      res.json(rules);
    } catch (error) {
      console.error('Get automation rules error:', error);
      res.status(500).json({ error: 'Failed to get automation rules' });
    }
  });

  // Support tickets with caching
  app.get("/api/admin/support/tickets", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = `admin_support_tickets_${req.user.id}`;
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const tickets = await storage.getAllSupportTickets();
      CacheManager.set('general', cacheKey, tickets);
      res.json(tickets);
    } catch (error) {
      console.error('Admin get all support tickets error:', error);
      res.status(500).json({ error: 'Failed to get all support tickets' });
    }
  });

  // Pending tontines with caching
  app.get("/api/admin/tontines/pending", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_pending_tontines';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const pendingTontines = await storage.getPendingTontines();
      
      CacheManager.set('general', cacheKey, pendingTontines);
      res.json(pendingTontines);
    } catch (error) {
      console.error('Get pending tontines error:', error);
      res.status(500).json({ error: 'Failed to get pending tontines' });
    }
  });

  // Pending prices with caching
  app.get("/api/admin/prices/pending", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_pending_prices';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const pendingPrices = await storage.getPendingPrices();
      
      CacheManager.set('general', cacheKey, pendingPrices);
      res.json(pendingPrices);
    } catch (error) {
      console.error('Get pending prices error:', error);
      res.status(500).json({ error: 'Failed to get pending prices' });
    }
  });

  // Suspended users with caching
  app.get("/api/admin/users/suspended", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_suspended_users';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const suspendedUsers = await storage.getSuspendedUsers();
      
      CacheManager.set('general', cacheKey, suspendedUsers);
      res.json(suspendedUsers);
    } catch (error) {
      console.error('Get suspended users error:', error);
      res.status(500).json({ error: 'Failed to get suspended users' });
    }
  });

  // Flagged posts with caching
  app.get("/api/admin/posts/flagged", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_flagged_posts';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const flaggedPosts = await storage.getFlaggedPosts();
      
      CacheManager.set('general', cacheKey, flaggedPosts);
      res.json(flaggedPosts);
    } catch (error) {
      console.error('Get flagged posts error:', error);
      res.status(500).json({ error: 'Failed to get flagged posts' });
    }
  });

  // Cache invalidation endpoint for admin
  app.post("/api/admin/cache/clear", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const { cacheType } = req.body;
      
      if (cacheType) {
        CacheManager.clear(cacheType as any);
      } else {
        CacheManager.clearAll();
      }
      
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Clear cache error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Cache stats endpoint for admin
  app.get("/api/admin/cache/stats", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const stats = CacheManager.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Get cache stats error:', error);
      res.status(500).json({ error: 'Failed to get cache stats' });
    }
  });

  // User routes
  app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      await storage.updateUserLastActive(req.user.id);
      const { pin, ...userResponse } = req.user;
      res.json(userResponse);
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  app.put("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const { name, email, country, region, language, currency, profilePicture, avatar } = req.body;
      
      // Only allow updating certain fields
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (country !== undefined) updateData.country = country;
      if (region !== undefined) updateData.region = region;
      if (language !== undefined) updateData.language = language;
      if (currency !== undefined) updateData.currency = currency;
      if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
      if (avatar !== undefined) updateData.avatar = avatar;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedUser = await storage.updateUser(req.user.id, updateData);
      await storage.updateUserLastActive(req.user.id);
      
      const { pin, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Password change route (enhanced to support both PIN and password)
  app.put("/api/user/password", authenticateToken, async (req: any, res) => {
    try {
      const passwordData = changePasswordSchema.parse(req.body);
      const { currentPin, currentPassword, newPassword } = passwordData;

      let isValidCredentials = false;

      // Verify current credentials
      if (currentPin) {
        isValidCredentials = await bcrypt.compare(currentPin, req.user.pin);
      } else if (currentPassword && req.user.password) {
        isValidCredentials = await bcrypt.compare(currentPassword, req.user.password);
      }

      if (!isValidCredentials) {
        return res.status(400).json({ error: 'Current credentials are incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password
      const updatedUser = await storage.updateUser(req.user.id, { password: hashedNewPassword });
      await storage.updateUserLastActive(req.user.id);

      // Invalidate all existing sessions for this user
      await storage.deleteAllUserSessions(req.user.id);

      const { pin, password, ...userResponse } = updatedUser;
      res.json({ 
        message: 'Password changed successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Change password error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Set password route (for users who only have PIN)
  app.post("/api/user/set-password", authenticateToken, async (req: any, res) => {
    try {
      const passwordData = setPasswordSchema.parse(req.body);
      const { currentPin, newPassword } = passwordData;

      // Verify current PIN
      const isValidPin = await bcrypt.compare(currentPin, req.user.pin);
      if (!isValidPin) {
        return res.status(400).json({ error: 'Current PIN is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password
      const updatedUser = await storage.updateUser(req.user.id, { password: hashedNewPassword });
      await storage.updateUserLastActive(req.user.id);

      const { pin, password, ...userResponse } = updatedUser;
      res.json({ 
        message: 'Password set successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Set password error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Failed to set password' });
    }
  });

  // PIN change route (separate from password)
  app.put("/api/user/pin", authenticateToken, async (req: any, res) => {
    try {
      const { currentPin, newPin } = req.body;

      if (!currentPin || !newPin) {
        return res.status(400).json({ error: 'Current PIN and new PIN are required' });
      }

      // Validate new PIN format
      if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        return res.status(400).json({ error: 'New PIN must be exactly 4 digits' });
      }

      // Verify current PIN
      const isValidCurrentPin = await bcrypt.compare(currentPin, req.user.pin);
      if (!isValidCurrentPin) {
        return res.status(400).json({ error: 'Current PIN is incorrect' });
      }

      // Hash new PIN
      const hashedNewPin = await bcrypt.hash(newPin, 10);

      // Update user's PIN
      const updatedUser = await storage.updateUser(req.user.id, { pin: hashedNewPin });
      await storage.updateUserLastActive(req.user.id);

      // Invalidate all existing sessions for this user
      await storage.deleteAllUserSessions(req.user.id);

      const { pin, password, ...userResponse } = updatedUser;
      res.json({ 
        message: 'PIN changed successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Change PIN error:', error);
      res.status(500).json({ error: 'Failed to change PIN' });
    }
  });

  // Tontine routes
  app.post("/api/tontines", authenticateToken, async (req: any, res) => {
    try {
      const tontineData = insertTontineSchema.parse({
        ...req.body,
        leaderId: req.user.id,
        region: req.user.region
      });

      const tontine = await storage.createTontine(tontineData);
      
      // Auto-join the creator as first member
      await storage.joinTontine(tontine.id, req.user.id);
      
      res.status(201).json(tontine);
    } catch (error) {
      console.error('Create tontine error:', error);
      res.status(400).json({ error: 'Failed to create tontine' });
    }
  });

  app.get("/api/tontines", authenticateToken, async (req: any, res) => {
    try {
      const tontines = await storage.getTontinesByUser(req.user.id);
      res.json(tontines);
    } catch (error) {
      console.error('Get tontines error:', error);
      res.status(500).json({ error: 'Failed to get tontines' });
    }
  });

  app.get("/api/tontines/:id", authenticateToken, async (req: any, res) => {
    try {
      const tontineId = parseInt(req.params.id);
      const tontine = await storage.getTontineWithMembers(tontineId);
      
      if (!tontine) {
        return res.status(404).json({ error: 'Tontine not found' });
      }

      res.json(tontine);
    } catch (error) {
      console.error('Get tontine error:', error);
      res.status(500).json({ error: 'Failed to get tontine' });
    }
  });

  app.post("/api/tontines/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const tontineId = parseInt(req.params.id);
      const member = await storage.joinTontine(tontineId, req.user.id);
      res.status(201).json(member);
    } catch (error) {
      console.error('Join tontine error:', error);
      res.status(400).json({ error: 'Failed to join tontine' });
    }
  });

  // Tontine payment routes
  app.post("/api/tontines/:id/payments", authenticateToken, async (req: any, res) => {
    try {
      const tontineId = parseInt(req.params.id);
      const { amount, paymentMethod } = req.body;

      if (!amount || !paymentMethod) {
        return res.status(400).json({ error: 'Amount and payment method are required' });
      }

      const fee = Math.round(amount * 0.02); // 2% fee
      
      const payment = await storage.createTontinePayment({
        tontineId,
        userId: req.user.id,
        amount,
        fee,
        paymentMethod
      });

      // Simulate payment processing
      setTimeout(async () => {
        const transactionId = `TXN_${Date.now()}_${payment.id}`;
        await storage.updatePaymentStatus(payment.id, 'completed', transactionId);
      }, 2000);

      res.status(201).json(payment);
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(400).json({ error: 'Failed to create payment' });
    }
  });

  app.get("/api/tontines/:id/payments", authenticateToken, async (req: any, res) => {
    try {
      const tontineId = parseInt(req.params.id);
      const payments = await storage.getTontinePayments(tontineId);
      res.json(payments);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Failed to get payments' });
    }
  });

  // Market price routes
  app.get("/api/market-prices", authenticateToken, async (req: any, res) => {
    try {
      let region = req.query.region;
      if (Array.isArray(region)) region = region[0];
      region = typeof region === 'string' ? region : 'all';
      const prices = await storage.getMarketPrices(region as string);
      res.json(prices);
    } catch (error) {
      console.error('Get market prices error:', error);
      res.status(500).json({ error: 'Failed to get market prices' });
    }
  });

  app.post("/api/market-prices", authenticateToken, async (req: any, res) => {
    try {
      const priceData = insertMarketPriceSchema.parse({
        ...req.body,
        submittedBy: req.user.id,
        region: req.user.region
      });

      const price = await storage.createMarketPrice(priceData);
      
      // Auto-verify if user is admin
      if (req.user.role === 'admin') {
        await storage.verifyMarketPrice(price.id, req.user.id);
      }

      res.status(201).json(price);
    } catch (error) {
      console.error('Create market price error:', error);
      res.status(400).json({ error: 'Failed to create market price' });
    }
  });

  // Admin route to approve market prices
  app.post("/api/market-prices/:id/verify", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const priceId = parseInt(req.params.id);
      await storage.verifyMarketPrice(priceId, req.user.id);
      
      res.json({ message: 'Price verified successfully' });
    } catch (error) {
      console.error('Verify market price error:', error);
      res.status(500).json({ error: 'Failed to verify price' });
    }
  });

  // Community routes
  app.get("/api/community/posts", authenticateToken, async (req: any, res) => {
    try {
      const region = req.query.region || req.user.region;
      const limit = parseInt(req.query.limit) || 20;
      const posts = await storage.getCommunityPosts(region, limit, req.user.id);
      res.json(posts);
    } catch (error) {
      console.error('Get community posts error:', error);
      res.status(500).json({ error: 'Failed to get community posts' });
    }
  });

  app.post("/api/community/posts", authenticateToken, async (req: any, res) => {
    try {
      const postData = insertCommunityPostSchema.parse({
        ...req.body,
        userId: req.user.id,
        region: req.user.region
      });

      const post = await storage.createCommunityPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error('Create community post error:', error);
      res.status(400).json({ error: 'Failed to create post' });
    }
  });

  // Weather routes
  app.get("/api/weather/alerts", authenticateToken, async (req: any, res) => {
    try {
      const region = req.query.region || req.user.region;
      // Return empty array for now since weather alerts table doesn't exist
      res.json([]);
    } catch (error) {
      console.error('Get weather alerts error:', error);
      res.status(500).json({ error: 'Failed to get weather alerts' });
    }
  });

  // External weather API integration
  app.get("/api/weather/current", authenticateToken, async (req: any, res) => {
    try {
      const region = req.query.region || req.user.region;
      
      // Use OpenWeatherMap API if available
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (apiKey) {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${region},CM&appid=${apiKey}&units=metric`);
        if (response.ok) {
          const weatherData = await response.json();
          return res.json({
            temperature: Math.round(weatherData.main.temp),
            condition: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
            visibility: Math.round(weatherData.visibility / 1000), // Convert m to km
            feelsLike: Math.round(weatherData.main.feels_like)
          });
        }
      }

      // Fallback weather data
      res.json({
        temperature: 28,
        condition: 'Partly cloudy',
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        feelsLike: 32
      });
    } catch (error) {
      console.error('Get weather error:', error);
      res.status(500).json({ error: 'Failed to get weather data' });
    }
  });

  // Support ticket routes
  app.post("/api/support/tickets", authenticateToken, async (req: any, res) => {
    try {
      const { subject, message, category, priority } = req.body;
      
      if (!subject || !message || !category || !priority) {
        return res.status(400).json({ error: 'Subject, message, category, and priority are required' });
      }

      const ticket = await storage.createSupportTicket({
        userId: req.user.id,
        subject,
        message,
        category,
        priority,
        status: 'open'
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error('Create support ticket error:', error);
      res.status(500).json({ error: 'Failed to create support ticket' });
    }
  });

  app.get("/api/support/tickets", authenticateToken, async (req: any, res) => {
    try {
      const tickets = await storage.getSupportTickets(req.user.id);
      res.json(tickets);
    } catch (error) {
      console.error('Get support tickets error:', error);
      res.status(500).json({ error: 'Failed to get support tickets' });
    }
  });

  // --- Admin Support Ticket Endpoints ---
  app.get("/api/admin/support/tickets", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error('Admin get all support tickets error:', error);
      res.status(500).json({ error: 'Failed to get all support tickets' });
    }
  });

  app.patch("/api/admin/support/tickets/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updates = req.body;
      const updatedTicket = await storage.updateSupportTicket(ticketId, {
        ...updates,
        updatedAt: new Date()
      });
      res.json(updatedTicket);
    } catch (error) {
      console.error('Admin update support ticket error:', error);
      res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // --- Support Ticket Notifications ---
  app.get("/api/support/notifications", authenticateToken, async (req: any, res) => {
    try {
      // For now, return tickets with status 'in_progress' or 'resolved' for the user (or all for admin)
      let tickets;
      if (['admin', 'super_admin'].includes(req.user.role)) {
        tickets = await storage.getAllSupportTickets();
      } else {
        tickets = await storage.getSupportTickets(req.user.id);
      }
      const notifications = tickets.filter((t: any) => t.status !== 'open');
      res.json(notifications);
    } catch (error) {
      console.error('Get support notifications error:', error);
      res.status(500).json({ error: 'Failed to get support notifications' });
    }
  });

  // Community comment routes
  app.post("/api/community/comments", authenticateToken, async (req: any, res) => {
    try {
      const { postId, content } = req.body;
      
      if (!postId || !content) {
        return res.status(400).json({ error: 'Post ID and content are required' });
      }

      const comment = await storage.createCommunityComment({
        postId,
        userId: req.user.id,
        content
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  app.get("/api/community/posts/:postId/comments", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Failed to get comments' });
    }
  });

  // Community like/unlike routes
  app.post("/api/community/posts/:postId/like", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      await storage.likePost(postId, req.user.id);
      res.json({ message: 'Post liked successfully' });
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ error: 'Failed to like post' });
    }
  });

  app.delete("/api/community/posts/:postId/unlike", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      await storage.unlikePost(postId, req.user.id);
      res.json({ message: 'Post unliked successfully' });
    } catch (error) {
      console.error('Unlike post error:', error);
      res.status(500).json({ error: 'Failed to unlike post' });
    }
  });

  // Tontine invite routes
  app.post("/api/tontine-invites", authenticateToken, async (req: any, res) => {
    try {
      const { tontineId, maxUses = 10, expiresAt } = req.body;
      
      if (!tontineId) {
        return res.status(400).json({ error: 'Tontine ID is required' });
      }

      const invite = await storage.createTontineInvite({
        tontineId,
        createdBy: req.user.id,
        inviteCode: `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive: true
      });

      res.status(201).json(invite);
    } catch (error) {
      console.error('Create tontine invite error:', error);
      res.status(500).json({ error: 'Failed to create tontine invite' });
    }
  });

  app.post("/api/tontine-invites/join", authenticateToken, async (req: any, res) => {
    try {
      const { inviteCode } = req.body;
      
      if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required' });
      }

      await storage.useTontineInvite(inviteCode);
      res.json({ message: 'Successfully joined tontine via invite' });
    } catch (error) {
      console.error('Join tontine via invite error:', error);
      res.status(400).json({ error: 'Failed to join tontine via invite' });
    }
  });

  // User search for invites
  app.get("/api/users/search", authenticateToken, async (req: any, res) => {
    try {
      const query = req.query.q;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error('User search error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  // Direct invite by user ID
  app.post("/api/tontines/:id/invite-user", authenticateToken, async (req: any, res) => {
    try {
      const tontineId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Check if user is the leader of this tontine
      const tontine = await storage.getTontineWithMembers(tontineId);
      if (!tontine || tontine.leaderId !== req.user.id) {
        return res.status(403).json({ error: 'Only the tontine leader can invite users' });
      }

      // Check if user is already a member
      const isMember = tontine.members?.some((member: any) => member.userId === userId);
      if (isMember) {
        return res.status(400).json({ error: 'User is already a member of this tontine' });
      }

      // Create invite for the specific user
      const invite = await storage.createTontineInvite({
        tontineId,
        createdBy: req.user.id,
        inviteCode: `DIRECT_${Date.now()}_${userId}`,
        maxUses: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true
      });

      res.status(201).json({ message: 'User invited successfully', invite });
    } catch (error) {
      console.error('Direct invite error:', error);
      res.status(500).json({ error: 'Failed to invite user' });
    }
  });

  // Advanced Payment & Banking System Routes
  app.post("/api/wallet/initialize", authenticateToken, async (req: any, res) => {
    try {
      const wallet = await storage.initializeUserWallet(req.user.id);
      res.status(201).json(wallet);
    } catch (error) {
      console.error('Initialize wallet error:', error);
      res.status(500).json({ error: 'Failed to initialize wallet' });
    }
  });

  app.get("/api/wallet/balance", authenticateToken, async (req: any, res) => {
    try {
      const wallet = await storage.getUserWallet(req.user.id);
      res.json(wallet);
    } catch (error) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({ error: 'Failed to get wallet balance' });
    }
  });

  app.post("/api/wallet/deposit", authenticateToken, async (req: any, res) => {
    try {
      const { amount, paymentMethod, reference } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const transaction = await storage.createWalletTransaction({
        walletId: req.user.id, // Will be resolved to actual wallet ID
        type: 'deposit',
        amount: amount * 100, // Convert to cents
        currency: 'XAF',
        description: 'Wallet deposit',
        paymentMethod,
        reference,
        status: 'pending'
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Wallet deposit error:', error);
      res.status(500).json({ error: 'Failed to process deposit' });
    }
  });

  app.post("/api/wallet/withdraw", authenticateToken, async (req: any, res) => {
    try {
      const { amount, paymentMethod, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const transaction = await storage.createWalletTransaction({
        walletId: req.user.id,
        type: 'withdrawal',
        amount: amount * 100,
        currency: 'XAF',
        description: description || 'Wallet withdrawal',
        paymentMethod,
        status: 'pending'
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Wallet withdrawal error:', error);
      res.status(500).json({ error: 'Failed to process withdrawal' });
    }
  });

  app.get("/api/wallet/transactions", authenticateToken, async (req: any, res) => {
    try {
      const transactions = await storage.getWalletTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // Scheduled Payments Routes
  app.post("/api/scheduled-payments", authenticateToken, async (req: any, res) => {
    try {
      const { type, amount, frequency, nextDueDate, description, paymentMethod } = req.body;
      
      if (!type || !amount || !frequency || !nextDueDate) {
        return res.status(400).json({ error: 'Type, amount, frequency, and next due date are required' });
      }

      const scheduledPayment = await storage.createScheduledPayment({
        userId: req.user.id,
        type,
        amount: amount * 100,
        currency: 'XAF',
        frequency,
        nextDueDate: new Date(nextDueDate),
        description,
        paymentMethod,
        isActive: true
      });

      res.status(201).json(scheduledPayment);
    } catch (error) {
      console.error('Create scheduled payment error:', error);
      res.status(500).json({ error: 'Failed to create scheduled payment' });
    }
  });

  app.get("/api/scheduled-payments", authenticateToken, async (req: any, res) => {
    try {
      const payments = await storage.getScheduledPayments(req.user.id);
      res.json(payments);
    } catch (error) {
      console.error('Get scheduled payments error:', error);
      res.status(500).json({ error: 'Failed to get scheduled payments' });
    }
  });

  // Direct Trading Marketplace Routes
  app.post("/api/marketplace/listings", authenticateToken, async (req: any, res) => {
    try {
      const { title, description, cropType, quantity, unit, pricePerUnit, location, images, quality, harvestDate, expiryDate, isNegotiable } = req.body;
      
      if (!title || !cropType || !quantity || !unit || !pricePerUnit || !location) {
        return res.status(400).json({ error: 'Title, crop type, quantity, unit, price per unit, and location are required' });
      }

      const listing = await storage.createMarketplaceListing({
        sellerId: req.user.id,
        title,
        description,
        cropType,
        quantity,
        unit,
        pricePerUnit: pricePerUnit * 100,
        currency: 'XAF',
        totalPrice: quantity * pricePerUnit * 100,
        location,
        images,
        quality: quality || 'standard',
        harvestDate: harvestDate ? new Date(harvestDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        isNegotiable: isNegotiable !== false
      });

      res.status(201).json(listing);
    } catch (error) {
      console.error('Create marketplace listing error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  });

  app.get("/api/marketplace/listings", authenticateToken, async (req: any, res) => {
    try {
      const { cropType, location, minPrice, maxPrice, quality } = req.query;
      const listings = await storage.getMarketplaceListings({
        cropType: cropType as string,
        location: location as string,
        minPrice: minPrice ? parseInt(minPrice as string) * 100 : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) * 100 : undefined,
        quality: quality as string
      });
      res.json(listings);
    } catch (error) {
      console.error('Get marketplace listings error:', error);
      res.status(500).json({ error: 'Failed to get listings' });
    }
  });

  app.get("/api/marketplace/listings/:id", authenticateToken, async (req: any, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const listing = await storage.getMarketplaceListing(listingId);
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Increment view count
      await storage.incrementListingViews(listingId);
      
      res.json(listing);
    } catch (error) {
      console.error('Get marketplace listing error:', error);
      res.status(500).json({ error: 'Failed to get listing' });
    }
  });

  app.post("/api/marketplace/listings/:id/bid", authenticateToken, async (req: any, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const { amount, message } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid bid amount is required' });
      }

      const bid = await storage.createMarketplaceBid({
        listingId,
        bidderId: req.user.id,
        amount: amount * 100,
        currency: 'XAF',
        message,
        status: 'active',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      res.status(201).json(bid);
    } catch (error) {
      console.error('Create marketplace bid error:', error);
      res.status(500).json({ error: 'Failed to create bid' });
    }
  });

  app.post("/api/marketplace/orders", authenticateToken, async (req: any, res) => {
    try {
      const { listingId, quantity, deliveryAddress, deliveryInstructions } = req.body;
      
      if (!listingId || !quantity || !deliveryAddress) {
        return res.status(400).json({ error: 'Listing ID, quantity, and delivery address are required' });
      }

      const order = await storage.createMarketplaceOrder({
        listingId,
        buyerId: req.user.id,
        sellerId: 0, // Will be set from listing
        quantity,
        unitPrice: 0, // Will be set from listing
        totalAmount: 0, // Will be calculated
        currency: 'XAF',
        deliveryAddress,
        deliveryInstructions,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      });

      res.status(201).json(order);
    } catch (error) {
      console.error('Create marketplace order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Enhanced Community Platform Routes
  app.post("/api/community/forums", authenticateToken, async (req: any, res) => {
    try {
      const { name, description, category, region, isPublic } = req.body;
      
      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const forum = await storage.createCommunityForum({
        name,
        description,
        category,
        region,
        isPublic: isPublic !== false,
        isActive: true,
        createdBy: req.user.id
      });

      res.status(201).json(forum);
    } catch (error) {
      console.error('Create community forum error:', error);
      res.status(500).json({ error: 'Failed to create forum' });
    }
  });

  app.get("/api/community/forums", authenticateToken, async (req: any, res) => {
    try {
      const { category, region } = req.query;
      const forums = await storage.getCommunityForums({
        category: category as string,
        region: region as string
      });
      res.json(forums);
    } catch (error) {
      console.error('Get community forums error:', error);
      res.status(500).json({ error: 'Failed to get forums' });
    }
  });

  app.post("/api/community/forums/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const forumId = parseInt(req.params.id);
      await storage.joinForum(forumId, req.user.id);
      res.json({ message: 'Successfully joined forum' });
    } catch (error) {
      console.error('Join forum error:', error);
      res.status(500).json({ error: 'Failed to join forum' });
    }
  });

  app.post("/api/community/forums/:id/posts", authenticateToken, async (req: any, res) => {
    try {
      const forumId = parseInt(req.params.id);
      const { title, content, type, tags } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const post = await storage.createForumPost({
        forumId,
        userId: req.user.id,
        title,
        content,
        type: type || 'discussion',
        tags
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Create forum post error:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.get("/api/community/forums/:id/posts", authenticateToken, async (req: any, res) => {
    try {
      const forumId = parseInt(req.params.id);
      const posts = await storage.getForumPosts(forumId);
      res.json(posts);
    } catch (error) {
      console.error('Get forum posts error:', error);
      res.status(500).json({ error: 'Failed to get posts' });
    }
  });

  // Knowledge Articles Routes
  app.post("/api/knowledge/articles", authenticateToken, async (req: any, res) => {
    try {
      const { title, content, category, tags } = req.body;
      
      if (!title || !content || !category) {
        return res.status(400).json({ error: 'Title, content, and category are required' });
      }

      const article = await storage.createKnowledgeArticle({
        title,
        content,
        category,
        tags,
        authorId: req.user.id,
        isPublished: false
      });

      res.status(201).json(article);
    } catch (error) {
      console.error('Create knowledge article error:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.get("/api/knowledge/articles", authenticateToken, async (req: any, res) => {
    try {
      const { category, featured } = req.query;
      const articles = await storage.getKnowledgeArticles({
        category: category as string,
        featured: featured === 'true'
      });
      res.json(articles);
    } catch (error) {
      console.error('Get knowledge articles error:', error);
      res.status(500).json({ error: 'Failed to get articles' });
    }
  });

  // Community Events Routes
  app.post("/api/community/events", authenticateToken, async (req: any, res) => {
    try {
      const { title, description, type, location, startDate, endDate, isOnline, meetingUrl, maxAttendees } = req.body;
      
      if (!title || !type || !startDate) {
        return res.status(400).json({ error: 'Title, type, and start date are required' });
      }

      const event = await storage.createCommunityEvent({
        title,
        description,
        type,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        isOnline: isOnline || false,
        meetingUrl,
        maxAttendees,
        organizerId: req.user.id,
        isActive: true
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Create community event error:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  app.get("/api/community/events", authenticateToken, async (req: any, res) => {
    try {
      const { type, location, upcoming } = req.query;
      const events = await storage.getCommunityEvents({
        type: type as string,
        location: location as string,
        upcoming: upcoming === 'true'
      });
      res.json(events);
    } catch (error) {
      console.error('Get community events error:', error);
      res.status(500).json({ error: 'Failed to get events' });
    }
  });

  app.post("/api/community/events/:id/register", authenticateToken, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.registerForEvent(eventId, req.user.id);
      res.json({ message: 'Successfully registered for event' });
    } catch (error) {
      console.error('Register for event error:', error);
      res.status(500).json({ error: 'Failed to register for event' });
    }
  });

  // Impact Tracking & Sustainability Routes
  app.post("/api/impact/metrics", authenticateToken, async (req: any, res) => {
    try {
      const { metricType, value, unit, period, date, description } = req.body;
      
      if (!metricType || !value || !unit || !period || !date) {
        return res.status(400).json({ error: 'Metric type, value, unit, period, and date are required' });
      }

      const metric = await storage.createImpactMetric({
        userId: req.user.id,
        metricType,
        value,
        unit,
        period,
        date: new Date(date),
        description
      });

      res.status(201).json(metric);
    } catch (error) {
      console.error('Create impact metric error:', error);
      res.status(500).json({ error: 'Failed to create metric' });
    }
  });

  app.get("/api/impact/metrics", authenticateToken, async (req: any, res) => {
    try {
      const { metricType, period, startDate, endDate } = req.query;
      const metrics = await storage.getImpactMetrics(req.user.id, {
        metricType: metricType as string,
        period: period as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(metrics);
    } catch (error) {
      console.error('Get impact metrics error:', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  app.post("/api/impact/carbon-credits", authenticateToken, async (req: any, res) => {
    try {
      const { practice, carbonSequestration, verificationStatus } = req.body;
      
      if (!practice || !carbonSequestration) {
        return res.status(400).json({ error: 'Practice and carbon sequestration are required' });
      }

      const carbonCredit = await storage.createCarbonCredit({
        userId: req.user.id,
        practice,
        carbonSequestration,
        verificationStatus: 'pending'
      });

      res.status(201).json(carbonCredit);
    } catch (error) {
      console.error('Create carbon credit error:', error);
      res.status(500).json({ error: 'Failed to create carbon credit' });
    }
  });

  app.get("/api/impact/carbon-credits", authenticateToken, async (req: any, res) => {
    try {
      const credits = await storage.getCarbonCredits(req.user.id);
      res.json(credits);
    } catch (error) {
      console.error('Get carbon credits error:', error);
      res.status(500).json({ error: 'Failed to get carbon credits' });
    }
  });

  app.post("/api/impact/sustainability-practices", authenticateToken, async (req: any, res) => {
    try {
      const { practice, implementationDate, impact, certification } = req.body;
      
      if (!practice || !implementationDate) {
        return res.status(400).json({ error: 'Practice and implementation date are required' });
      }

      const sustainabilityPractice = await storage.createSustainabilityPractice({
        userId: req.user.id,
        practice,
        implementationDate: new Date(implementationDate),
        impact,
        certification,
        status: 'implemented'
      });

      res.status(201).json(sustainabilityPractice);
    } catch (error) {
      console.error('Create sustainability practice error:', error);
      res.status(500).json({ error: 'Failed to create sustainability practice' });
    }
  });

  app.get("/api/impact/sustainability-practices", authenticateToken, async (req: any, res) => {
    try {
      const practices = await storage.getSustainabilityPractices(req.user.id);
      res.json(practices);
    } catch (error) {
      console.error('Get sustainability practices error:', error);
      res.status(500).json({ error: 'Failed to get sustainability practices' });
    }
  });

  app.post("/api/impact/sdg-tracking", authenticateToken, async (req: any, res) => {
    try {
      const { sdgGoal, indicator, value, target, unit, description } = req.body;
      
      if (!sdgGoal || !indicator || !value || !unit) {
        return res.status(400).json({ error: 'SDG goal, indicator, value, and unit are required' });
      }

      const sdgTracking = await storage.createSdgTracking({
        userId: req.user.id,
        sdgGoal,
        indicator,
        value,
        target,
        unit,
        date: new Date(),
        description
      });

      res.status(201).json(sdgTracking);
    } catch (error) {
      console.error('Create SDG tracking error:', error);
      res.status(500).json({ error: 'Failed to create SDG tracking' });
    }
  });

  app.get("/api/impact/sdg-tracking", authenticateToken, async (req: any, res) => {
    try {
      const { sdgGoal } = req.query;
      const tracking = await storage.getSdgTracking(req.user.id, {
        sdgGoal: sdgGoal ? parseInt(sdgGoal as string) : undefined
      });
      res.json(tracking);
    } catch (error) {
      console.error('Get SDG tracking error:', error);
      res.status(500).json({ error: 'Failed to get SDG tracking' });
    }
  });

  // ===== ADMIN AUTOMATION ROUTES =====
  
  // Admin Dashboard Overview
  app.get("/api/admin/dashboard", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        totalTontines,
        activeTontines,
        totalContributions,
        automationStats
      ] = await Promise.all([
        storage.getUserCount(),
        storage.getActiveUserCount(),
        storage.getNewUserCount(new Date()),
        storage.getTontineCount(),
        storage.getActiveTontineCount(),
        storage.getTotalContributions(),
        adminAutomation.getAutomationStats()
      ]);

      res.json({
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday
        },
        tontines: {
          total: totalTontines,
          active: activeTontines,
          totalContributions
        },
        automation: automationStats
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  });

  // Admin Notifications
  app.get("/api/admin/notifications", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminNotifications();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const notifications = await storage.getAdminNotifications(req.user.id);
      CacheManager.set('stats', cacheKey, notifications);
      res.json(notifications);
    } catch (error) {
      console.error('Get admin notifications error:', error);
      res.status(500).json({ error: 'Failed to get admin notifications' });
    }
  });

  app.put("/api/admin/notifications/:id/read", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Automation Rules Management
  app.get("/api/admin/automation/rules", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminAutomationRules();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const rules = await storage.getAutomationRules({});
      CacheManager.set('stats', cacheKey, rules);
      res.json(rules);
    } catch (error) {
      console.error('Get automation rules error:', error);
      res.status(500).json({ error: 'Failed to get automation rules' });
    }
  });

  app.post("/api/admin/automation/rules", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const { ruleType, ruleName, description, conditions, actions, priority } = req.body;
      
      if (!ruleType || !ruleName || !conditions || !actions) {
        return res.status(400).json({ error: 'Rule type, name, conditions, and actions are required' });
      }

      const rule = await adminAutomation.createRule({
        ruleType,
        ruleName,
        description,
        conditions,
        actions,
        priority: priority || 1,
        isActive: true,
        createdBy: req.user.id
      });

      res.status(201).json(rule);
    } catch (error) {
      console.error('Create automation rule error:', error);
      res.status(500).json({ error: 'Failed to create automation rule' });
    }
  });

  app.put("/api/admin/automation/rules/:id", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      const updates = req.body;
      
      const rule = await adminAutomation.updateRule(ruleId, updates);
      res.json(rule);
    } catch (error) {
      console.error('Update automation rule error:', error);
      res.status(500).json({ error: 'Failed to update automation rule' });
    }
  });

  app.delete("/api/admin/automation/rules/:id", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      await adminAutomation.deleteRule(ruleId);
      res.json({ message: 'Automation rule deleted' });
    } catch (error) {
      console.error('Delete automation rule error:', error);
      res.status(500).json({ error: 'Failed to delete automation rule' });
    }
  });

  // Automation Executions
  app.get("/api/admin/automation/executions", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { ruleId, entityType, success, startDate, endDate } = req.query;
      const executions = await storage.getAutomationExecutions({
        ruleId: ruleId ? parseInt(ruleId as string) : undefined,
        entityType: entityType as string,
        success: success === 'true',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(executions);
    } catch (error) {
      console.error('Get automation executions error:', error);
      res.status(500).json({ error: 'Failed to get automation executions' });
    }
  });

  // Admin Audit Logs
  app.get("/api/admin/audit-logs", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { adminId, entityType, action, startDate, endDate } = req.query;
      const logs = await storage.getAdminAuditLogs({
        adminId: adminId ? parseInt(adminId as string) : undefined,
        entityType: entityType as string,
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  });

  // System Metrics
  app.get("/api/admin/metrics", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminMetrics();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const { metricType, period, startDate, endDate } = req.query;
      const metrics = await storage.getSystemMetrics({
        metricType: metricType as string,
        period: period as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      CacheManager.set('stats', cacheKey, metrics);
      res.json(metrics);
    } catch (error) {
      console.error('Get system metrics error:', error);
      res.status(500).json({ error: 'Failed to get system metrics' });
    }
  });

  app.post("/api/admin/metrics/generate", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      await adminAutomation.generateSystemMetrics();
      res.json({ message: 'System metrics generated successfully' });
    } catch (error) {
      console.error('Generate metrics error:', error);
      res.status(500).json({ error: 'Failed to generate metrics' });
    }
  });

  // Admin Settings
  app.get("/api/admin/settings", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { category } = req.query;
      const settings = await storage.getAdminSettings(category as string);
      res.json(settings);
    } catch (error) {
      console.error('Get admin settings error:', error);
      res.status(500).json({ error: 'Failed to get admin settings' });
    }
  });

  app.get("/api/admin/settings/:key", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getAdminSetting(key);
      
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Get admin setting error:', error);
      res.status(500).json({ error: 'Failed to get admin setting' });
    }
  });

  app.put("/api/admin/settings/:key", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const { key } = req.params;
      const { settingValue, description } = req.body;
      
      if (settingValue === undefined) {
        return res.status(400).json({ error: 'Setting value is required' });
      }

      const setting = await storage.updateAdminSetting(key, {
        settingValue,
        description,
        updatedBy: req.user.id
      });
      
      res.json(setting);
    } catch (error) {
      console.error('Update admin setting error:', error);
      res.status(500).json({ error: 'Failed to update admin setting' });
    }
  });

  // Admin Reports
  app.get("/api/admin/reports", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { reportType, status, generatedBy } = req.query;
      const reports = await storage.getAdminReports({
        reportType: reportType as string,
        status: status as string,
        generatedBy: generatedBy ? parseInt(generatedBy as string) : undefined
      });
      res.json(reports);
    } catch (error) {
      console.error('Get admin reports error:', error);
      res.status(500).json({ error: 'Failed to get admin reports' });
    }
  });

  app.post("/api/admin/reports", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { reportType, title, description, parameters, format } = req.body;
      
      if (!reportType || !title) {
        return res.status(400).json({ error: 'Report type and title are required' });
      }

      const report = await storage.createAdminReport({
        reportType,
        title,
        description,
        parameters,
        format: format || 'json',
        generatedBy: req.user.id,
        status: 'generating'
      });

      res.status(201).json(report);
    } catch (error) {
      console.error('Create admin report error:', error);
      res.status(500).json({ error: 'Failed to create admin report' });
    }
  });

  // Admin Workflows
  app.get("/api/admin/workflows", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { workflowType, status, assignedTo } = req.query;
      const workflows = await storage.getAdminWorkflows({
        workflowType: workflowType as string,
        status: status as string,
        assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined
      });
      res.json(workflows);
    } catch (error) {
      console.error('Get admin workflows error:', error);
      res.status(500).json({ error: 'Failed to get admin workflows' });
    }
  });

  app.put("/api/admin/workflows/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const updates = req.body;
      
      const workflow = await storage.updateAdminWorkflow(workflowId, updates);
      res.json(workflow);
    } catch (error) {
      console.error('Update admin workflow error:', error);
      res.status(500).json({ error: 'Failed to update admin workflow' });
    }
  });

  // User Management (Admin)
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { status, role, region } = req.query;
      let users = await storage.searchUsers('');
      
      // Filter by role if specified
      if (role) {
        users = users.filter(user => user.role === role);
      }
      
      // Filter by region if specified
      if (region) {
        users = users.filter(user => user.region === region);
      }
      
      // Note: status filtering removed as it's not in the schema
      
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Prevent updating sensitive fields unless super admin
      if (req.user.role !== 'super_admin') {
        delete updates.role;
        delete updates.balance;
        delete updates.premiumExpiresAt;
      }
      
      const user = await storage.updateUser(userId, updates);
      
      // Log the admin action
      await adminAutomation.logAdminAction(
        req.user.id,
        'suspend_user',
        'user',
        userId,
        updates,
        'manual',
        req.body.reason
      );
      
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Tontine Management (Admin)
  app.get("/api/admin/tontines", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { status, region } = req.query;
      // This would need a new method in storage to get all tontines with filters
      const tontines = await storage.getTontinesByUser(0); // Placeholder - need to implement getAllTontines
      res.json(tontines);
    } catch (error) {
      console.error('Get tontines error:', error);
      res.status(500).json({ error: 'Failed to get tontines' });
    }
  });

  app.put("/api/admin/tontines/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const tontineId = parseInt(req.params.id);
      const updates = req.body;
      
      const tontine = await storage.updateTontine(tontineId, updates);
      
      // Log the admin action
      await adminAutomation.logAdminAction(
        req.user.id,
        'approve_tontine',
        'tontine',
        tontineId,
        updates,
        'manual',
        req.body.reason
      );
      
      res.json(tontine);
    } catch (error) {
      console.error('Update tontine error:', error);
      res.status(500).json({ error: 'Failed to update tontine' });
    }
  });

  // Market Price Management (Admin)
  app.get("/api/admin/market-prices", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { region, isVerified } = req.query;
      const prices = await storage.getMarketPrices(region as string || 'all');
      
      // Apply verification filter
      if (isVerified !== undefined) {
        const verified = isVerified === 'true';
        const filteredPrices = prices.filter(price => price.isVerified === verified);
        res.json(filteredPrices);
      } else {
        res.json(prices);
      }
    } catch (error) {
      console.error('Get market prices error:', error);
      res.status(500).json({ error: 'Failed to get market prices' });
    }
  });

  app.put("/api/admin/market-prices/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const priceId = parseInt(req.params.id);
      const updates = req.body;
      
      const price = await storage.updateMarketPrice(priceId, updates);
      
      // Log the admin action
      await adminAutomation.logAdminAction(
        req.user.id,
        'reject_price',
        'price',
        priceId,
        updates,
        'manual',
        req.body.reason
      );
      
      res.json(price);
    } catch (error) {
      console.error('Update market price error:', error);
      res.status(500).json({ error: 'Failed to update market price' });
    }
  });

  // Community Content Management (Admin)
  app.get("/api/admin/community/posts", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { region, status } = req.query;
      const posts = await storage.getCommunityPosts(region as string || 'all', 100);
      
      // Apply status filter if provided
      if (status) {
        const filteredPosts = posts.filter((post: any) => post.post.status === status);
        res.json(filteredPosts);
      } else {
        res.json(posts);
      }
    } catch (error) {
      console.error('Get community posts error:', error);
      res.status(500).json({ error: 'Failed to get community posts' });
    }
  });

  app.put("/api/admin/community/posts/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const updates = req.body;
      
      const post = await storage.updateCommunityPost(postId, updates);
      
      // Log the admin action
      await adminAutomation.logAdminAction(
        req.user.id,
        'override_automation',
        'post',
        postId,
        updates,
        'manual',
        req.body.reason
      );
      
      res.json(post);
    } catch (error) {
      console.error('Update community post error:', error);
      res.status(500).json({ error: 'Failed to update community post' });
    }
  });

  // Manual Automation Triggers
  app.post("/api/admin/automation/trigger", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const { ruleType, entityType, entityId, triggerData } = req.body;
      
      if (!ruleType || !entityType || !entityId) {
        return res.status(400).json({ error: 'Rule type, entity type, and entity ID are required' });
      }

      const executions = await adminAutomation.executeRules(ruleType, entityType, entityId, triggerData);
      
      res.json({
        message: 'Automation triggered successfully',
        executions
      });
    } catch (error) {
      console.error('Trigger automation error:', error);
      res.status(500).json({ error: 'Failed to trigger automation' });
    }
  });

  // Admin Dashboard Stats
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = CacheManager.keys.adminStats();
      const cached = CacheManager.get('stats', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const totalUsers = await storage.getUserCount();
      const activeTontines = await storage.getActiveTontineCount();
      const totalContributions = await storage.getTotalContributions();
      
      // Calculate revenue (2% fee on contributions)
      const totalRevenue = Math.floor(totalContributions * 0.02);
      
      // Get premium users count
      const allUsers = await storage.searchUsers('');
      const premiumUsers = allUsers.filter((user: any) => user.plan === 'premium' || user.plan === 'enterprise').length;
      
      const stats = {
        totalUsers,
        activeTontines,
        totalRevenue,
        premiumUsers,
        totalContributions
      };

      CacheManager.set('stats', cacheKey, stats);
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Failed to get admin stats' });
    }
  });

  // Pending Tontines
  app.get("/api/admin/tontines/pending", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_pending_tontines';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const allTontines = await storage.getTontinesByUser(0); // Get all tontines
      const pendingTontines = allTontines.filter((tontine: any) => tontine.status === 'pending');
      
      // Get leader info for each tontine
      const tontinesWithLeaders = await Promise.all(
        pendingTontines.map(async (tontine: any) => {
          if (tontine.leaderId) {
            const leader = await storage.getUser(tontine.leaderId);
            return { ...tontine, leader };
          }
          return tontine;
        })
      );
      
      CacheManager.set('general', cacheKey, tontinesWithLeaders);
      res.json(tontinesWithLeaders);
    } catch (error) {
      console.error('Get pending tontines error:', error);
      res.status(500).json({ error: 'Failed to get pending tontines' });
    }
  });

  // Pending Prices
  app.get("/api/admin/prices/pending", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_pending_prices';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const allPrices = await storage.getMarketPrices('all');
      const pendingPrices = allPrices.filter((price: any) => !price.isVerified);
      
      // Get submitter info for each price
      const pricesWithSubmitters = await Promise.all(
        pendingPrices.map(async (price: any) => {
          if (price.submittedBy) {
            const submitter = await storage.getUser(price.submittedBy);
            return { ...price, submittedBy: submitter };
          }
          return price;
        })
      );
      
      CacheManager.set('general', cacheKey, pricesWithSubmitters);
      res.json(pricesWithSubmitters);
    } catch (error) {
      console.error('Get pending prices error:', error);
      res.status(500).json({ error: 'Failed to get pending prices' });
    }
  });

  // Suspended Users
  app.get("/api/admin/users/suspended", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_suspended_users';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const allUsers = await storage.searchUsers('');
      // Note: We don't have a status field in the schema, so we'll return empty for now
      // In a real implementation, you'd filter by status === 'suspended'
      const suspendedUsers: any[] = [];
      
      CacheManager.set('general', cacheKey, suspendedUsers);
      res.json(suspendedUsers);
    } catch (error) {
      console.error('Get suspended users error:', error);
      res.status(500).json({ error: 'Failed to get suspended users' });
    }
  });

  // Flagged Posts
  app.get("/api/admin/posts/flagged", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cacheKey = 'admin_flagged_posts';
      const cached = CacheManager.get('general', cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const allPosts = await storage.getCommunityPosts('all', 100);
      // Note: We don't have a flagged status in the schema, so we'll return empty for now
      // In a real implementation, you'd filter by status === 'flagged'
      const flaggedPosts: any[] = [];
      
      CacheManager.set('general', cacheKey, flaggedPosts);
      res.json(flaggedPosts);
    } catch (error) {
      console.error('Get flagged posts error:', error);
      res.status(500).json({ error: 'Failed to get flagged posts' });
    }
  });

  // Admin Actions
  app.post("/api/admin/:type/:id/:action", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { type, id, action } = req.params;
      const entityId = parseInt(id);
      
      switch (type) {
        case 'tontine':
          if (action === 'approve') {
            await storage.approveTontine(entityId, req.user.id);
          } else if (action === 'reject') {
            await storage.rejectTontine(entityId, req.user.id, req.body.reason);
          }
          break;
          
        case 'price':
          if (action === 'approve') {
            await storage.verifyMarketPrice(entityId, req.user.id);
          } else if (action === 'reject') {
            await storage.updateMarketPrice(entityId, { isVerified: false });
          }
          break;
          
        case 'user':
          if (action === 'unsuspend') {
            await storage.updateUser(entityId, { lastActive: new Date() });
          } else if (action === 'ban') {
            await storage.updateUser(entityId, { lastActive: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) });
          }
          break;
          
        case 'post':
          if (action === 'approve') {
            // Mark post as approved by updating content or adding approval flag
            await storage.updateCommunityPost(entityId, { content: `[APPROVED] ${req.body.content || ''}` });
          } else if (action === 'reject') {
            // Mark post as rejected
            await storage.updateCommunityPost(entityId, { content: `[REJECTED] ${req.body.content || ''}` });
          }
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid entity type' });
      }
      
      // Clear relevant caches
      CacheManager.clear('general');
      CacheManager.clear(type === 'tontine' ? 'tontines' : type === 'price' ? 'prices' : 'posts');
      
      // Log the admin action
      await adminAutomation.logAdminAction(
        req.user.id,
        `${action}_${type}` as any,
        type,
        entityId,
        { action },
        'manual',
        req.body.reason
      );
      
      res.json({ message: `${type} ${action} successful` });
    } catch (error) {
      console.error('Admin action error:', error);
      res.status(500).json({ error: 'Failed to perform admin action' });
    }
  });

  // Profile picture upload endpoint
  app.post('/api/user/profile-picture', authenticateToken, upload.single('profilePicture'), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }

      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;
      const filePath = `uploads/profiles/${fileName}`;

      // Save file to uploads directory
      const uploadDir = path.join(__dirname, '../uploads/profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);

      // Update user profile with new picture URL
      const profilePictureUrl = `/uploads/profiles/${fileName}`;
      
      await storage.updateUser(userId, {
        profilePicture: profilePictureUrl,
        updatedAt: new Date()
      });

      res.json({ 
        success: true, 
        profilePicture: profilePictureUrl,
        message: 'Profile picture updated successfully' 
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Admin Dashboard Data
  app.get("/api/admin/dashboard", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Get admin dashboard error:', error);
      res.status(500).json({ error: 'Failed to get admin dashboard data' });
    }
  });

  // Admin Notifications
  app.get("/api/admin/notifications", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      // Mock notifications for now
      const notifications = [
        {
          id: 1,
          type: 'system',
          title: 'System Update',
          message: 'New features have been deployed',
          priority: 'medium' as const,
          isRead: false,
          actionRequired: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          type: 'user',
          title: 'New User Registration',
          message: 'A new user has registered and needs approval',
          priority: 'high' as const,
          isRead: false,
          actionRequired: true,
          createdAt: new Date().toISOString()
        }
      ];
      res.json(notifications);
    } catch (error) {
      console.error('Get admin notifications error:', error);
      res.status(500).json({ error: 'Failed to get admin notifications' });
    }
  });

  // Mark notification as read
  app.put("/api/admin/notifications/:id/read", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      // In a real implementation, you'd update the notification status
      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Admin Automation Rules
  app.get("/api/admin/automation/rules", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      // Mock automation rules for now
      const rules = [
        {
          id: 1,
          ruleType: 'price_verification',
          ruleName: 'Auto-verify trusted users',
          description: 'Automatically verify market prices from trusted users',
          isActive: true,
          priority: 1
        },
        {
          id: 2,
          ruleType: 'user_moderation',
          ruleName: 'Flag suspicious content',
          description: 'Automatically flag posts with suspicious keywords',
          isActive: true,
          priority: 2
        }
      ];
      res.json(rules);
    } catch (error) {
      console.error('Get automation rules error:', error);
      res.status(500).json({ error: 'Failed to get automation rules' });
    }
  });

  // Trigger automation
  app.post("/api/admin/automation/trigger", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const { ruleType, entityType, entityId, triggerData } = req.body;
      // In a real implementation, you'd trigger the automation rule
      console.log(`Triggering automation: ${ruleType} for ${entityType} ${entityId}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Trigger automation error:', error);
      res.status(500).json({ error: 'Failed to trigger automation' });
    }
  });

  // Admin Metrics
  app.get("/api/admin/metrics", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const { metricType, period } = req.query;
      // Mock metrics for now
      const metrics = [
        {
          id: 1,
          metricType: metricType || 'user_growth',
          metricName: 'Daily User Growth',
          value: '15',
          unit: 'users',
          period: period || 'daily',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          metricType: metricType || 'user_growth',
          metricName: 'Weekly User Growth',
          value: '89',
          unit: 'users',
          period: period || 'weekly',
          createdAt: new Date().toISOString()
        }
      ];
      res.json(metrics);
    } catch (error) {
      console.error('Get admin metrics error:', error);
      res.status(500).json({ error: 'Failed to get admin metrics' });
    }
  });

  // Generate metrics
  app.post("/api/admin/metrics/generate", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      // In a real implementation, you'd generate new metrics
      console.log('Generating new metrics...');
      res.json({ success: true, message: 'Metrics generated successfully' });
    } catch (error) {
      console.error('Generate metrics error:', error);
      res.status(500).json({ error: 'Failed to generate metrics' });
    }
  });

  // --- Admin Premium Subscription Plan Management ---
  app.get('/api/admin/premium/plans', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      // List all active plans
      const plans = await storage.getAdminSettings('billing');
      res.json(plans.filter((p: any) => p.settingKey.startsWith('premium_plan_')));
    } catch (error) {
      console.error('Get premium plans error:', error);
      res.status(500).json({ error: 'Failed to get premium plans' });
    }
  });

  app.post('/api/admin/premium/plans', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { name, displayName, description, price, currency, duration, features } = req.body;
      if (!name || !displayName || !price || !duration) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const key = `premium_plan_${name}`;
      const setting = await storage.createAdminSetting({
        settingKey: key,
        settingValue: { name, displayName, description, price, currency, duration, features },
        description: displayName,
        category: 'billing',
        isPublic: true,
        updatedBy: req.user.id
      });
      res.status(201).json(setting);
    } catch (error) {
      console.error('Create premium plan error:', error);
      res.status(500).json({ error: 'Failed to create premium plan' });
    }
  });

  app.put('/api/admin/premium/plans/:key', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const key = req.params.key;
      const updates = req.body;
      const setting = await storage.updateAdminSetting(key, { settingValue: updates, updatedBy: req.user.id });
      res.json(setting);
    } catch (error) {
      console.error('Update premium plan error:', error);
      res.status(500).json({ error: 'Failed to update premium plan' });
    }
  });

  app.delete('/api/admin/premium/plans/:key', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const key = req.params.key;
      // Deactivate the plan
      const setting = await storage.updateAdminSetting(key, { isPublic: false, updatedBy: req.user.id });
      res.json(setting);
    } catch (error) {
      console.error('Deactivate premium plan error:', error);
      res.status(500).json({ error: 'Failed to deactivate premium plan' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

