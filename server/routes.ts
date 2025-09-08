import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage.js';
import { adminAutomation } from './admin-automation.js';
import CacheManager from './cache.js';
import { AuthService } from './auth-service.js';
import { AnalyticsService } from './analytics-service.js';
import { NotificationService } from './notification-service.js';
import type { Request, Response } from 'express';

const router = express.Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to verify admin role
const requireAdmin = (req: any, res: Response, next: any) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to verify super admin role
const requireSuperAdmin = (req: any, res: Response, next: any) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Authentication routes
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { phone, pin, password, email, name, country, region, language } = req.body;

    if (!phone || !name || !region) {
      return res.status(400).json({ error: 'Phone, name, and region are required' });
    }

    if (!pin && !password) {
      return res.status(400).json({ error: 'Either PIN or password is required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Hash PIN and/or password
    const hashedPin = pin ? await bcrypt.hash(pin, 10) : null;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const userData = {
      phone,
      email: email || null,
      pin: hashedPin,
      password: hashedPassword,
      name,
      country: country || 'CM',
      region,
      language: language || 'en',
      currency: 'XAF',
      plan: 'free',
      role: 'user',
      balance: '0',
      isActive: true,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = await storage.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        region: user.region,
        role: user.role,
        plan: user.plan,
        balance: user.balance,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { phone, pin, password, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone number or email is required' });
    }

    if (!pin && !password) {
      return res.status(400).json({ error: 'PIN or password is required' });
    }

    // Find user by phone or email
    let user;
    if (phone) {
      user = await storage.getUserByPhone(phone);
    } else if (email) {
      user = await storage.getUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is suspended' });
    }

    // Verify PIN or password
    let isValidCredential = false;
    if (pin && user.pin) {
      isValidCredential = await bcrypt.compare(pin, user.pin);
    } else if (password && user.password) {
      isValidCredential = await bcrypt.compare(password, user.password);
    }

    if (!isValidCredential) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    await storage.updateUserLastActive(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        country: user.country,
        region: user.region,
        language: user.language,
        currency: user.currency,
        plan: user.plan,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

router.post('/auth/logout', authenticateToken, async (req: any, res: Response) => {
  try {
    // In a real implementation, you might want to blacklist the token
    res.json({ success: true, message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Logout failed' });
  }
});

// User profile routes
router.get('/user/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      country: user.country,
      region: user.region,
      language: user.language,
      currency: user.currency,
      profilePicture: user.profilePicture,
      plan: user.plan,
      role: user.role,
      balance: user.balance,
      lastActive: user.lastActive,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to get profile' });
  }
});

router.put('/user/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const { name, email, country, region, language } = req.body;
    
    const updatedUser = await storage.updateUser(req.user.id, {
      name,
      email,
      country,
      region,
      language,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        email: updatedUser.email,
        name: updatedUser.name,
        country: updatedUser.country,
        region: updatedUser.region,
        language: updatedUser.language,
        currency: updatedUser.currency,
        plan: updatedUser.plan,
        role: updatedUser.role,
        balance: updatedUser.balance,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

router.put('/user/pin', authenticateToken, async (req: any, res: Response) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required' });
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user || !user.pin) {
      return res.status(400).json({ error: 'User not found or PIN not set' });
    }

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, user.pin);
    if (!isValidPin) {
      return res.status(400).json({ error: 'Current PIN is incorrect' });
    }

    // Hash new PIN
    const hashedNewPin = await bcrypt.hash(newPin, 10);

    // Update PIN
    await storage.updateUser(req.user.id, {
      pin: hashedNewPin,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'PIN updated successfully',
    });
  } catch (error: any) {
    console.error('Update PIN error:', error);
    res.status(500).json({ error: error.message || 'Failed to update PIN' });
  }
});

router.put('/user/password', authenticateToken, async (req: any, res: Response) => {
  try {
    const { currentPin, currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify current credentials
    let isValidCredential = false;
    if (currentPin && user.pin) {
      isValidCredential = await bcrypt.compare(currentPin, user.pin);
    } else if (currentPassword && user.password) {
      isValidCredential = await bcrypt.compare(currentPassword, user.password);
    }

    if (!isValidCredential) {
      return res.status(400).json({ error: 'Current credentials are incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await storage.updateUser(req.user.id, {
      password: hashedNewPassword,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    console.error('Update password error:', error);
    res.status(500).json({ error: error.message || 'Failed to update password' });
  }
});

router.post('/user/set-password', authenticateToken, async (req: any, res: Response) => {
  try {
    const { currentPin, newPassword } = req.body;

    if (!currentPin || !newPassword) {
      return res.status(400).json({ error: 'Current PIN and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user || !user.pin) {
      return res.status(400).json({ error: 'User not found or PIN not set' });
    }

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, user.pin);
    if (!isValidPin) {
      return res.status(400).json({ error: 'Current PIN is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await storage.updateUser(req.user.id, {
      password: hashedNewPassword,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Password set successfully',
    });
  } catch (error: any) {
    console.error('Set password error:', error);
    res.status(500).json({ error: error.message || 'Failed to set password' });
  }
});

// Tontine routes
router.get('/tontines', authenticateToken, async (req: any, res: Response) => {
  try {
    const tontines = await storage.getTontinesByUser(req.user.id);
    res.json(tontines);
  } catch (error: any) {
    console.error('Get tontines error:', error);
    res.status(500).json({ error: error.message || 'Failed to get tontines' });
  }
});

router.post('/tontines', authenticateToken, async (req: any, res: Response) => {
  try {
    const { name, monthlyContribution, maxMembers, payoutSchedule, description, rules } = req.body;

    if (!name || !monthlyContribution) {
      return res.status(400).json({ error: 'Name and monthly contribution are required' });
    }

    const tontineData = {
      name,
      leaderId: req.user.id,
      monthlyContribution: monthlyContribution.toString(),
      maxMembers: maxMembers || 10,
      payoutSchedule: payoutSchedule || 'monthly',
      description: description || null,
      rules: rules || null,
      region: req.user.region,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tontine = await storage.createTontine(tontineData);

    // Add creator as first member
    await storage.joinTontine(tontine.id, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Tontine created successfully',
      tontine,
    });
  } catch (error: any) {
    console.error('Create tontine error:', error);
    res.status(500).json({ error: error.message || 'Failed to create tontine' });
  }
});

router.get('/tontines/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const tontineId = parseInt(req.params.id);
    const tontine = await storage.getTontineWithMembers(tontineId);
    
    if (!tontine) {
      return res.status(404).json({ error: 'Tontine not found' });
    }

    res.json(tontine);
  } catch (error: any) {
    console.error('Get tontine error:', error);
    res.status(500).json({ error: error.message || 'Failed to get tontine' });
  }
});

router.post('/tontines/:id/join', authenticateToken, async (req: any, res: Response) => {
  try {
    const tontineId = parseInt(req.params.id);
    
    const member = await storage.joinTontine(tontineId, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Joined tontine successfully',
      member,
    });
  } catch (error: any) {
    console.error('Join tontine error:', error);
    res.status(500).json({ error: error.message || 'Failed to join tontine' });
  }
});

router.post('/tontines/:id/payments', authenticateToken, async (req: any, res: Response) => {
  try {
    const tontineId = parseInt(req.params.id);
    const { amount, paymentMethod, reference } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    const fee = parseFloat(amount) * 0.02; // 2% platform fee

    const paymentData = {
      tontineId,
      userId: req.user.id,
      amount: amount.toString(),
      fee: fee.toString(),
      paymentMethod,
      reference: reference || null,
      status: 'completed', // For demo purposes
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const payment = await storage.createTontinePayment(paymentData);

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      payment,
    });
  } catch (error: any) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to process payment' });
  }
});

router.get('/tontines/:id/payments', authenticateToken, async (req: any, res: Response) => {
  try {
    const tontineId = parseInt(req.params.id);
    const payments = await storage.getTontinePayments(tontineId);
    res.json(payments);
  } catch (error: any) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: error.message || 'Failed to get payments' });
  }
});

// Tontine invite routes
router.post('/tontine-invites', authenticateToken, async (req: any, res: Response) => {
  try {
    const { tontineId, maxUses, expiresAt } = req.body;

    if (!tontineId) {
      return res.status(400).json({ error: 'Tontine ID is required' });
    }

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const inviteData = {
      tontineId,
      inviteCode,
      createdBy: req.user.id,
      maxUses: maxUses || 10,
      currentUses: 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const invite = await storage.createTontineInvite(inviteData);

    res.status(201).json({
      success: true,
      message: 'Invite created successfully',
      invite,
    });
  } catch (error: any) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: error.message || 'Failed to create invite' });
  }
});

router.post('/tontine-invites/join', authenticateToken, async (req: any, res: Response) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const tontine = await storage.getTontineByInviteCode(inviteCode);
    if (!tontine) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Join the tontine
    const member = await storage.joinTontine(tontine.id, req.user.id);

    // Update invite usage
    await storage.useTontineInvite(inviteCode);

    res.json({
      success: true,
      message: 'Joined tontine successfully',
      tontine,
      member,
    });
  } catch (error: any) {
    console.error('Join by invite error:', error);
    res.status(500).json({ error: error.message || 'Failed to join tontine' });
  }
});

// Market price routes
router.get('/market-prices', async (req: Request, res: Response) => {
  try {
    const region = req.query.region as string || 'all';
    
    // Check cache first
    const cacheKey = CacheManager.keys.prices(region);
    const cached = CacheManager.get('prices', cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const prices = await storage.getMarketPrices(region);
    
    // Cache the result
    CacheManager.set('prices', cacheKey, prices);
    
    res.json(prices);
  } catch (error: any) {
    console.error('Get market prices error:', error);
    res.status(500).json({ error: error.message || 'Failed to get market prices' });
  }
});

router.post('/market-prices', authenticateToken, async (req: any, res: Response) => {
  try {
    const { crop, price, unit } = req.body;

    if (!crop || !price) {
      return res.status(400).json({ error: 'Crop and price are required' });
    }

    const priceData = {
      crop,
      price: price.toString(),
      unit: unit || 'kg',
      region: req.user.region,
      submittedBy: req.user.id,
      isVerified: req.user.role === 'admin' || req.user.role === 'super_admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const marketPrice = await storage.createMarketPrice(priceData);

    // Clear cache
    CacheManager.clear('prices');

    res.status(201).json({
      success: true,
      message: 'Market price submitted successfully',
      price: marketPrice,
    });
  } catch (error: any) {
    console.error('Create market price error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit market price' });
  }
});

router.post('/market-prices/:id/verify', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const priceId = parseInt(req.params.id);
    
    await storage.verifyMarketPrice(priceId, req.user.id);
    
    // Clear cache
    CacheManager.clear('prices');

    res.json({
      success: true,
      message: 'Market price verified successfully',
    });
  } catch (error: any) {
    console.error('Verify market price error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify market price' });
  }
});

// Community routes
router.get('/community/posts', async (req: Request, res: Response) => {
  try {
    const region = req.query.region as string || 'all';
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = (req as any).user?.id;

    // Check cache first
    const cacheKey = CacheManager.keys.posts(region, limit, userId);
    const cached = CacheManager.get('posts', cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const posts = await storage.getCommunityPosts(region, limit, userId);
    
    // Cache the result
    CacheManager.set('posts', cacheKey, posts);
    
    res.json(posts);
  } catch (error: any) {
    console.error('Get community posts error:', error);
    res.status(500).json({ error: error.message || 'Failed to get community posts' });
  }
});

router.post('/community/posts', authenticateToken, async (req: any, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const postData = {
      userId: req.user.id,
      content: content.trim(),
      region: req.user.region,
      likes: 0,
      comments: 0,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const post = await storage.createCommunityPost(postData);

    // Clear cache
    CacheManager.clear('posts');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post,
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

router.post('/community/posts/:id/like', authenticateToken, async (req: any, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    await storage.likePost(postId, req.user.id);
    
    // Clear cache
    CacheManager.clear('posts');

    res.json({
      success: true,
      message: 'Post liked successfully',
    });
  } catch (error: any) {
    console.error('Like post error:', error);
    res.status(500).json({ error: error.message || 'Failed to like post' });
  }
});

router.delete('/community/posts/:id/unlike', authenticateToken, async (req: any, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    await storage.unlikePost(postId, req.user.id);
    
    // Clear cache
    CacheManager.clear('posts');

    res.json({
      success: true,
      message: 'Post unliked successfully',
    });
  } catch (error: any) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: error.message || 'Failed to unlike post' });
  }
});

router.post('/community/comments', authenticateToken, async (req: any, res: Response) => {
  try {
    const { postId, content } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }

    const commentData = {
      postId,
      userId: req.user.id,
      content: content.trim(),
      createdAt: new Date(),
    };

    const comment = await storage.createCommunityComment(commentData);

    // Clear cache
    CacheManager.clear('posts');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
});

router.get('/community/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const comments = await storage.getPostComments(postId);
    res.json(comments);
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: error.message || 'Failed to get comments' });
  }
});

// Weather routes
router.get('/weather/current', async (req: Request, res: Response) => {
  try {
    const region = req.query.region as string;
    
    // Mock weather data for now
    const weatherData = {
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      feelsLike: 31,
      uvIndex: 7,
      location: region || 'Your Region',
    };

    res.json(weatherData);
  } catch (error: any) {
    console.error('Get weather error:', error);
    res.status(500).json({ error: error.message || 'Failed to get weather data' });
  }
});

router.get('/weather/alerts', async (req: Request, res: Response) => {
  try {
    const region = req.query.region as string;
    
    // Mock weather alerts for now
    const alerts = [
      {
        id: 1,
        region: region || 'all',
        alertType: 'rain',
        message: 'Heavy rain expected tomorrow. Protect your crops and livestock.',
        severity: 'high',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    res.json(alerts);
  } catch (error: any) {
    console.error('Get weather alerts error:', error);
    res.status(500).json({ error: error.message || 'Failed to get weather alerts' });
  }
});

// Support ticket routes
router.post('/support/tickets', authenticateToken, async (req: any, res: Response) => {
  try {
    const { subject, message, category, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const ticketData = {
      userId: req.user.id,
      subject,
      message,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ticket = await storage.createSupportTicket(ticketData);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket,
    });
  } catch (error: any) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: error.message || 'Failed to create support ticket' });
  }
});

router.get('/support/tickets', authenticateToken, async (req: any, res: Response) => {
  try {
    const tickets = await storage.getSupportTickets(req.user.id);
    res.json(tickets);
  } catch (error: any) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: error.message || 'Failed to get support tickets' });
  }
});

// User search route
router.get('/users/search', authenticateToken, async (req: any, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await storage.searchUsers(query);
    
    // Return limited user info for privacy
    const safeUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      region: user.region,
    }));

    res.json(safeUsers);
  } catch (error: any) {
    console.error('Search users error:', error);
    res.status(500).json({ error: error.message || 'Failed to search users' });
  }
});

router.post('/tontines/:id/invite-user', authenticateToken, async (req: any, res: Response) => {
  try {
    const tontineId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user is tontine leader
    const tontine = await storage.getTontineWithMembers(tontineId);
    if (!tontine || tontine.leaderId !== req.user.id) {
      return res.status(403).json({ error: 'Only tontine leader can invite users' });
    }

    // Add user to tontine
    const member = await storage.joinTontine(tontineId, userId);

    res.json({
      success: true,
      message: 'User invited successfully',
      member,
    });
  } catch (error: any) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: error.message || 'Failed to invite user' });
  }
});

// Admin routes
router.get('/admin/stats', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    // Check cache first
    const cacheKey = CacheManager.keys.adminStats();
    const cached = CacheManager.get('stats', cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const stats = await storage.getAdminStats();
    
    // Cache the result
    CacheManager.set('stats', cacheKey, stats);
    
    res.json(stats);
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get admin stats' });
  }
});

router.get('/admin/tontines/pending', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const pendingTontines = await storage.getPendingTontines();
    res.json(pendingTontines);
  } catch (error: any) {
    console.error('Get pending tontines error:', error);
    res.status(500).json({ error: error.message || 'Failed to get pending tontines' });
  }
});

router.get('/admin/prices/pending', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const pendingPrices = await storage.getPendingPrices();
    res.json(pendingPrices);
  } catch (error: any) {
    console.error('Get pending prices error:', error);
    res.status(500).json({ error: error.message || 'Failed to get pending prices' });
  }
});

router.get('/admin/users/suspended', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const suspendedUsers = await storage.getSuspendedUsers();
    res.json(suspendedUsers);
  } catch (error: any) {
    console.error('Get suspended users error:', error);
    res.status(500).json({ error: error.message || 'Failed to get suspended users' });
  }
});

router.get('/admin/posts/flagged', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const flaggedPosts = await storage.getFlaggedPosts();
    res.json(flaggedPosts);
  } catch (error: any) {
    console.error('Get flagged posts error:', error);
    res.status(500).json({ error: error.message || 'Failed to get flagged posts' });
  }
});

// Admin action routes
router.post('/admin/tontine/:id/approve', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const tontineId = parseInt(req.params.id);
    
    await storage.approveTontine(tontineId, req.user.id);
    
    // Clear cache
    CacheManager.invalidateAdminData();

    res.json({
      success: true,
      message: 'Tontine approved successfully',
    });
  } catch (error: any) {
    console.error('Approve tontine error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve tontine' });
  }
});

router.post('/admin/tontine/:id/reject', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const tontineId = parseInt(req.params.id);
    const { reason } = req.body;
    
    await storage.rejectTontine(tontineId, req.user.id, reason);
    
    // Clear cache
    CacheManager.invalidateAdminData();

    res.json({
      success: true,
      message: 'Tontine rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject tontine error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject tontine' });
  }
});

router.post('/admin/price/:id/approve', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const priceId = parseInt(req.params.id);
    
    await storage.verifyMarketPrice(priceId, req.user.id);
    
    // Clear cache
    CacheManager.clear('prices');
    CacheManager.invalidateAdminData();

    res.json({
      success: true,
      message: 'Price approved successfully',
    });
  } catch (error: any) {
    console.error('Approve price error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve price' });
  }
});

router.post('/admin/price/:id/reject', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const priceId = parseInt(req.params.id);
    
    await storage.updateMarketPrice(priceId, { isVerified: false });
    
    // Clear cache
    CacheManager.clear('prices');
    CacheManager.invalidateAdminData();

    res.json({
      success: true,
      message: 'Price rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject price error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject price' });
  }
});

// Support ticket admin routes
router.get('/admin/support/tickets', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const tickets = await storage.getAllSupportTickets();
    res.json(tickets);
  } catch (error: any) {
    console.error('Get all support tickets error:', error);
    res.status(500).json({ error: error.message || 'Failed to get support tickets' });
  }
});

router.patch('/admin/support/tickets/:id', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    const updateData = req.body;

    const updatedTicket = await storage.updateSupportTicket(ticketId, {
      ...updateData,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      ticket: updatedTicket,
    });
  } catch (error: any) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ error: error.message || 'Failed to update support ticket' });
  }
});

// Premium plan management routes
router.get('/admin/premium/plans', authenticateToken, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const plans = await storage.getAdminSettings('premium_plans');
    res.json(plans);
  } catch (error: any) {
    console.error('Get premium plans error:', error);
    res.status(500).json({ error: error.message || 'Failed to get premium plans' });
  }
});

router.post('/admin/premium/plans', authenticateToken, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const { name, displayName, description, price, currency, duration, features } = req.body;

    if (!name || !displayName || !price) {
      return res.status(400).json({ error: 'Name, display name, and price are required' });
    }

    const planData = {
      settingKey: `premium_plan_${name}`,
      settingValue: {
        name,
        displayName,
        description,
        price: parseFloat(price),
        currency: currency || 'XAF',
        duration: duration || 30,
        features: Array.isArray(features) ? features : features?.split(',').map((f: string) => f.trim()) || [],
      },
      description: `Premium plan: ${displayName}`,
      category: 'premium_plans',
      isPublic: true,
      updatedBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const plan = await storage.createAdminSetting(planData);

    res.status(201).json({
      success: true,
      message: 'Premium plan created successfully',
      plan,
    });
  } catch (error: any) {
    console.error('Create premium plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to create premium plan' });
  }
});

router.put('/admin/premium/plans/:key', authenticateToken, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const key = req.params.key;
    const updateData = req.body;

    const updatedPlan = await storage.updateAdminSetting(key, {
      settingValue: updateData,
      updatedBy: req.user.id,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Premium plan updated successfully',
      plan: updatedPlan,
    });
  } catch (error: any) {
    console.error('Update premium plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to update premium plan' });
  }
});

router.delete('/admin/premium/plans/:key', authenticateToken, requireSuperAdmin, async (req: any, res: Response) => {
  try {
    const key = req.params.key;

    await storage.updateAdminSetting(key, {
      settingValue: { ...req.body, isActive: false },
      updatedBy: req.user.id,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Premium plan deactivated successfully',
    });
  } catch (error: any) {
    console.error('Deactivate premium plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to deactivate premium plan' });
  }
});

// Health check route
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: 'active',
    };

    res.json(health);
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message || 'Health check failed',
    });
  }
});

// Cache management routes
router.get('/admin/cache/stats', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const stats = CacheManager.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Get cache stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get cache stats' });
  }
});

router.post('/admin/cache/clear', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { cacheType } = req.body;

    if (cacheType && ['users', 'tontines', 'posts', 'prices', 'stats', 'general'].includes(cacheType)) {
      CacheManager.clear(cacheType as any);
    } else {
      CacheManager.clearAll();
    }

    res.json({
      success: true,
      message: `Cache ${cacheType || 'all'} cleared successfully`,
    });
  } catch (error: any) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: error.message || 'Failed to clear cache' });
  }
});

// Analytics routes
router.get('/analytics/comprehensive', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const analytics = await AnalyticsService.getComprehensiveAnalytics();
    res.json(analytics);
  } catch (error: any) {
    console.error('Get comprehensive analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get analytics' });
  }
});

router.get('/analytics/realtime', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const realTimeData = await AnalyticsService.getRealTimeAnalytics();
    res.json(realTimeData);
  } catch (error: any) {
    console.error('Get real-time analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get real-time analytics' });
  }
});

// Error handling middleware
router.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Route error:', error);
  res.status(500).json({
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

export function registerRoutes(app: express.Application) {
  app.use('/api', router);
  
  // Create HTTP server
  const server = require('http').createServer(app);
  
  return server;
}