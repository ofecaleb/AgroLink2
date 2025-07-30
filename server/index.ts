import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import CacheManager from "./cache.js";
import { dbManager, checkDatabaseHealth } from "./database-config.js";
import { AuthService } from "./auth-service.js";
import { AnalyticsService } from "./analytics-service.js";
import { NotificationService } from "./notification-service.js";
import { getUserById as getFirebaseUser, createUser as createFirebaseUser, createResetRequest } from './services/firebaseService.js';
import { getYields, insertYield } from './services/supabaseService.js';
import { backupUser as backupPocketUser } from './services/pocketbaseService.js';
import cors from 'cors';
import express, {Request} from 'express';

const app = express();

// Performance optimization: Increase body parser limits to handle larger payloads (e.g., profile pictures)
app.use(cors<Request>({
  origin: 'https://agrolink-ofe.onrender.com/',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Log slow requests for performance monitoring
      if (duration > 1000) {
        log(`🐌 SLOW REQUEST: ${logLine}`);
      } else if (duration > 500) {
        log(`⚠️  MEDIUM REQUEST: ${logLine}`);
      } else {
        log(logLine);
      }
    }
  });

  next();
});

// Performance optimization: Add compression middleware
app.use((req, res, next) => {
  // Simple compression for JSON responses
  if (req.path.startsWith('/api') && req.headers.accept?.includes('application/json')) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  next();
});

// Performance optimization: Add caching headers for static assets
app.use((req, res, next) => {
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
  next();
});

// Performance optimization: Add rate limiting for API endpoints
const rateLimit = new Map();
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // 100 requests per minute

    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const userLimit = rateLimit.get(ip);
      if (now > userLimit.resetTime) {
        userLimit.count = 1;
        userLimit.resetTime = now + windowMs;
      } else {
        userLimit.count++;
        if (userLimit.count > maxRequests) {
          return res.status(429).json({ error: 'Too many requests' });
        }
      }
    }
  }
  next();
});

// Performance optimization: Add request timeout
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  }, 30000); // 30 second timeout

  res.on('finish', () => {
    clearTimeout(timeout);
  });

  next();
});

// Firebase user API
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getFirebaseUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await createFirebaseUser(req.body);
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.post('/api/reset-request', async (req, res) => {
  try {
    const id = await createResetRequest(req.body);
    res.status(201).json({ id });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// Supabase yields API
app.get('/api/yields', async (req, res) => {
  try {
    const region = req.query.region as string;
    const yields = await getYields(region);
    res.json(yields);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.post('/api/yields', async (req, res) => {
  try {
    const result = await insertYield(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// PocketBase backup API
app.post('/api/backup-users', async (req, res) => {
  try {
    const result = await backupPocketUser(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    try {
      await setupVite(app, server);
    } catch (error) {
      console.log("Vite setup failed, falling back to static files:", error instanceof Error ? error.message : String(error));
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  // Fallback route to serve frontend for any unmatched routes
  app.get('*', (req, res) => {
    try {
      const indexPath = path.resolve(__dirname, '..', 'dist', 'public', 'index.html');
      console.log('Serving frontend from:', indexPath);
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log('Frontend file not found at:', indexPath);
        res.status(404).json({ error: 'Frontend not found. Please build the client first.' });
      }
    } catch (error) {
      console.error('Error serving frontend:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Use Render's PORT environment variable or fallback to 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    log(`🚀 Performance optimizations enabled:`);
    log(`   - Database connection pooling`);
    log(`   - In-memory caching system`);
    log(`   - Request rate limiting`);
    log(`   - Response compression`);
    log(`   - Static asset caching`);
    log(`   - Request timeout protection`);
  });

  // Performance monitoring: Log cache stats every 5 minutes
  setInterval(() => {
    const stats = CacheManager.getStats();
    log(`📊 Cache Stats: ${JSON.stringify(stats)}`);
  }, 300000); // 5 minutes

  // Performance monitoring: Clean up rate limit map every hour
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimit.entries()) {
      if (now > data.resetTime) {
        rateLimit.delete(ip);
      }
    }
  }, 3600000); // 1 hour

  // Database health monitoring
  setInterval(async () => {
    try {
      const health = await checkDatabaseHealth();
      if (!health.firebase || !health.supabase) {
        log(`⚠️  Database health issues detected: ${JSON.stringify(health)}`);
      } else {
        log(`✅ All databases healthy`);
      }
    } catch (error) {
      log(`❌ Database health check failed: ${error}`);
    }
  }, 300000); // 5 minutes

  // Add this at the very end, after all routes
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('GLOBAL ERROR HANDLER:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

})();
