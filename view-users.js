import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = "postgresql://neondb_owner:npg_NyYh3WmnxHv0@ep-falling-credit-a8pgs9tk-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function viewUsers() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔗 Connecting to Neon database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');
    
    // Query all users with all fields
    const result = await client.query(`
      SELECT * FROM users ORDER BY created_at DESC
    `);
    
    client.release();
    
    if (result.rows.length === 0) {
      console.log('📭 No users found in the database.');
      console.log('💡 Try registering a new account first!');
    } else {
      console.log(`👥 Found ${result.rows.length} user(s):\n`);
      
      result.rows.forEach((user, index) => {
        console.log(`--- User ${index + 1} ---`);
        console.log(`ID: ${user.id}`);
        console.log(`Phone: ${user.phone || 'Not set'}`);
        console.log(`Email: ${user.email || 'Not set'}`);
        console.log(`Name: ${user.name || 'Not set'}`);
        console.log(`Country: ${user.country || 'Not set'}`);
        console.log(`Region: ${user.region || 'Not set'}`);
        console.log(`Language: ${user.language || 'Not set'}`);
        console.log(`Currency: ${user.currency || 'Not set'}`);
        console.log(`Plan: ${user.plan || 'Not set'}`);
        console.log(`Role: ${user.role || 'Not set'}`);
        console.log(`Balance: ${user.balance || 0} CFA`);
        console.log(`Last Active: ${user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}`);
        console.log(`Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`Updated: ${user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Never'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n💡 The users table does not exist yet.');
      console.log('   Run: npm run db:push');
    }
  } finally {
    await pool.end();
  }
}

// Run the script
viewUsers().catch(console.error); 