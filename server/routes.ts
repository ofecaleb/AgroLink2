import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage.js";
import { insertUserSchema, insertTontineSchema, insertMarketPriceSchema, insertCommunityPostSchema, insertTontinePaymentSchema } from "../shared/schema.js";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      
      const user = await storage.createUser({
        ...userData,
        pin: hashedPin
      });

      // Remove PIN from response
      const { pin, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, pin } = req.body;

      if (!phone || !pin) {
        return res.status(400).json({ error: 'Phone and PIN are required' });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPin = await bcrypt.compare(pin, user.pin);
      if (!isValidPin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create session
      const sessionToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30m' });
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await storage.createSession(user.id, sessionToken, expiresAt);
      await storage.updateUserLastActive(user.id);

      const { pin: _, ...userResponse } = user;
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
      const { name, email, region, language, profilePicture } = req.body;
      
      // Validate input
      if (!name && !email && !region && !language && !profilePicture) {
        return res.status(400).json({ error: 'At least one field must be provided for update' });
      }

      // Update user profile
      const updatedUser = await storage.updateUser(req.user.id, {
        ...(name && { name }),
        ...(email && { email }),
        ...(region && { region }),
        ...(language && { language }),
        ...(profilePicture && { profilePicture })
      });

      const { pin, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
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
      const region = req.query.region || req.user.region;
      const prices = await storage.getMarketPrices(region);
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
      const posts = await storage.getCommunityPosts(region, limit);
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
      const alerts = await storage.getActiveWeatherAlerts(region);
      res.json(alerts);
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

  const httpServer = createServer(app);
  return httpServer;
}
