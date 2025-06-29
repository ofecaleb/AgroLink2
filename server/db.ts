import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

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
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  }
} catch (error) {
  console.log("⚠️  Database connection failed, using mock database");
  db = createMockDb();
}

export { pool };
export { db };
