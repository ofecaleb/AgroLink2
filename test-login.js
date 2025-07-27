import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = "postgresql://neondb_owner:npg_NyYh3WmnxHv0@ep-falling-credit-a8pgs9tk-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function testLogin() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔗 Connecting to Neon database...');
    
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');
    
    // Get the user with hashed credentials
    const result = await client.query(`
      SELECT id, phone, name, pin, password, role 
      FROM users 
      WHERE phone = '683273200'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('--- Current User in Database ---');
    console.log(`ID: ${user.id}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`PIN Hash: ${user.pin ? user.pin.substring(0, 20) + '...' : 'NULL'}`);
    console.log(`Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);
    console.log('');
    
    // Test PIN authentication
    console.log('🔐 Testing PIN authentication...');
    const testPin = '7294';
    const pinMatch = user.pin ? await bcrypt.compare(testPin, user.pin) : false;
    console.log(`PIN '${testPin}' matches: ${pinMatch}`);
    
    // Test Password authentication
    console.log('🔐 Testing Password authentication...');
    const testPassword = 'Agro#2025!FarmX9';
    const passwordMatch = user.password ? await bcrypt.compare(testPassword, user.password) : false;
    console.log(`Password '${testPassword}' matches: ${passwordMatch}`);
    
    if (!pinMatch && !passwordMatch) {
      console.log('\n❌ Neither PIN nor Password match!');
      console.log('🔄 Recreating credentials...');
      
      // Recreate the credentials
      const newHashedPin = await bcrypt.hash('7294', 10);
      const newHashedPassword = await bcrypt.hash('Agro#2025!FarmX9', 10);
      
      await client.query(`
        UPDATE users 
        SET pin = $1, password = $2, updated_at = $3
        WHERE phone = '683273200'
      `, [newHashedPin, newHashedPassword, new Date()]);
      
      console.log('✅ Credentials updated!');
      console.log('🔐 New Login Credentials:');
      console.log(`Phone: 683273200`);
      console.log(`PIN: 7294`);
      console.log(`Password: Agro#2025!FarmX9`);
    } else {
      console.log('\n✅ Credentials are working!');
      console.log('🔐 Login Credentials:');
      console.log(`Phone: 683273200`);
      console.log(`PIN: 7294`);
      console.log(`Password: Agro#2025!FarmX9`);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
testLogin().catch(console.error); 