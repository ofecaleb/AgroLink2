import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = "postgresql://neondb_owner:npg_NyYh3WmnxHv0@ep-falling-credit-a8pgs9tk-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function updateCredentials() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔗 Connecting to Neon database...');
    
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');
    
    // Hash the new PIN and password
    const hashedPin = await bcrypt.hash('7294', 10);
    const hashedPassword = await bcrypt.hash('Agro#2025!FarmX9', 10);
    
    console.log('🔐 Updating credentials for Dr Ofe Caleb...');
    
    // Update the super admin credentials
    const updateResult = await client.query(`
      UPDATE users 
      SET 
        pin = $1,
        password = $2,
        updated_at = $3
      WHERE phone = '683273200' AND role = 'super_admin'
      RETURNING id, phone, email, name, role, plan, balance
    `, [hashedPin, hashedPassword, new Date()]);
    
    if (updateResult.rowCount === 0) {
      console.log('❌ User not found or not a super admin');
      return;
    }
    
    const user = updateResult.rows[0];
    
    console.log('✅ Credentials updated successfully!\n');
    console.log('--- Updated Account Details ---');
    console.log(`ID: ${user.id}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Plan: ${user.plan}`);
    console.log(`Balance: ${user.balance} CFA`);
    console.log('');
    console.log('🔐 New Login Credentials:');
    console.log(`Phone: ${user.phone}`);
    console.log(`PIN: 7294`);
    console.log(`Password: Agro#2025!FarmX9`);
    console.log('');
    console.log('💡 You can now login with either PIN or Password!');
    console.log('🌐 Go to: http://localhost:5000');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
updateCredentials().catch(console.error); 