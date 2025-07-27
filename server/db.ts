import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

// Performance optimization: Configure connection pooling
const createOptimizedPool = (connectionString: string) => {
  return new Pool({
    connectionString,
    // Optimize connection pool for better performance
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Connection timeout
  });
};

// Mock database for development preview
const createMockDb = () => {
  console.log("⚠️  Using mock database for preview - no data will persist");
  return {
    insert: () => ({ values: () => ({ returning: () => [{}] }) }),
    select: () => ({ from: () => ({ where: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [{}] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [{}] }) }),
  };
};

let pool: Pool | null = null;
let db: any = null;

try {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not set, using mock database");
    db = createMockDb();
  } else {
    pool = createOptimizedPool(process.env.DATABASE_URL);
    db = drizzle(pool, { schema });
    
    // Test connection and log pool status
    pool.on('connect', () => {
      console.log('✅ Database connection established');
    });
    
    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
    });
    
    pool.on('remove', () => {
      console.log('🔌 Database connection removed from pool');
    });
  }
} catch (error) {
  console.log("⚠️  Database connection failed, using mock database");
  console.error('Database connection error:', error);
  db = createMockDb();
}

export { pool };
export { db };
