import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';

console.log('Drizzle import test successful!');
console.log('drizzle:', typeof drizzle);
console.log('sql:', typeof sql);
