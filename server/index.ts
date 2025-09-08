import 'dotenv/config'; // ✅ ES module syntax
import express, { type Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { registerRoutes } from './routes.js';
import { setupVite, serveStatic, log } from './vite.js';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://agrolink-ofe.onrender.com', 'https://your-domain.com']
        : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (pathName.startsWith('/api')) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + '…';
      if (duration > 1000) log(`🐌 SLOW REQUEST: ${logLine}`);
      else if (duration > 500) log(`⚠️  MEDIUM REQUEST: ${logLine}`);
      else log(logLine);
    }
  });

  next();
});

// Simple rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const ip = req.ip || req.connection.remoteAddress || '';
    const now = Date.now();
    const windowMs = 60_000;
    const maxRequests = 100;

    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const userLimit = rateLimit.get(ip)!;
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

  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      res.status(status).json({ message });
      throw err;
    }
  );

  if (app.get('env') === 'development') {
    try {
      await setupVite(app, server);
    } catch (error) {
      console.log(
        'Vite setup failed, falling back to static files:',
        error instanceof Error ? error.message : String(error)
      );
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  // Fallback route
  app.get('*', (req, res) => {
    const indexPath = path.resolve(
      __dirname,
      '..',
      'dist',
      'public',
      'index.html'
    );
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Frontend not found. Build client first.' });
    }
  });

  const port = process.env.PORT || 5000;
  server.listen({ port, host: '0.0.0.0', reusePort: true }, () => {
    log(`🚀 AgroLink server running on port ${port}`);
  });

  // Cleanup rate limit
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimit.entries()) {
      if (now > data.resetTime) rateLimit.delete(ip);
    }
  }, 3_600_000); // 1 hour
})();
