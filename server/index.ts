import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://agrolink-ofe.onrender.com', 'https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
// Body parser middleware
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

// Simple rate limiting
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
    log(`🚀 AgroLink server running`);
    log(`   - Environment: ${process.env.NODE_ENV}`);
    log(`   - Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    log(`   - Frontend: ${app.get("env") === "development" ? 'Vite dev server' : 'Static files'}`);
  });

  // Clean up rate limit map every hour
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimit.entries()) {
      if (now > data.resetTime) {
        rateLimit.delete(ip);
      }
    }
  }, 3600000); // 1 hour

})();
