import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = "postgresql://neondb_owner:npg_NyYh3WmnxHv0@ep-falling-credit-a8pgs9tk-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function setupSuperAdmin() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔗 Connecting to Neon database...');
    
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');
    
    // Delete all related records first (in correct order to avoid foreign key violations)
    console.log('🗑️  Cleaning up all user-related data...');
    
    const tablesToClean = [
      'community_likes',
      'community_comments', 
      'community_posts',
      'tontine_payments',
      'tontine_members',
      'tontine_invites',
      'market_prices',
      'weather_alerts',
      'support_tickets',
      'user_sessions',
      'user_subscriptions',
      'subscription_payments',
      'user_content_access',
      'user_wallets',
      'wallet_transactions',
      'scheduled_payments',
      'marketplace_listings',
      'marketplace_orders',
      'marketplace_bids',
      'forum_members',
      'forum_posts',
      'forum_comments',
      'event_attendees',
      'community_events',
      'carbon_credits',
      'sustainability_practices',
      'sdg_tracking',
      'impact_metrics',
      'admin_audit_logs',
      'automation_executions',
      'admin_notifications',
      'admin_dashboards',
      'system_metrics',
      'admin_workflows',
      'admin_reports',
      'admin_settings',
      'admin_api_keys',
      'admin_scheduled_tasks',
      'admin_data_exports',
      'user_roles',
      'user_permissions',
      'tontines'
    ];
    
    for (const table of tablesToClean) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleaned ${table}: ${result.rowCount} records`);
      } catch (error) {
        // Table might not exist, that's okay
        console.log(`⚠️  Table ${table} not found or already empty`);
      }
    }
    
    // Now delete all users
    console.log('\n🗑️  Deleting all existing users...');
    const deleteResult = await client.query('DELETE FROM users');
    console.log(`✅ Deleted ${deleteResult.rowCount} existing user(s)\n`);
    
    // Create super admin account
    console.log('👑 Creating Super Admin account...');
    
    // Hash the PIN (using 1234 as default PIN)
    const hashedPin = await bcrypt.hash('1234', 10);
    
    // Insert super admin
    const insertResult = await client.query(`
      INSERT INTO users (
        phone,
        email,
        name,
        country,
        region,
        language,
        currency,
        plan,
        role,
        balance,
        pin,
        last_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, phone, email, name, country, region, role, plan, balance, created_at
    `, [
      '683273200',
      'ofecaleb3@gmail.com',
      'Dr Ofe caleb CEO-SA',
      'CM',
      'yaounde',
      'en',
      'USD',
      'enterprise',
      'super_admin',
      100000, // Starting balance of 100,000 CFA
      hashedPin,
      new Date(),
      new Date(),
      new Date()
    ]);
    
    const newUser = insertResult.rows[0];
    
    console.log('✅ Super Admin account created successfully!\n');
    console.log('--- Super Admin Details ---');
    console.log(`ID: ${newUser.id}`);
    console.log(`Phone: ${newUser.phone}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Name: ${newUser.name}`);
    console.log(`Country: ${newUser.country}`);
    console.log(`Region: ${newUser.region}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Plan: ${newUser.plan}`);
    console.log(`Balance: ${newUser.balance} CFA`);
    console.log(`Created: ${new Date(newUser.created_at).toLocaleString()}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`Phone: ${newUser.phone}`);
    console.log(`PIN: 1234`);
    console.log('');
    console.log('💡 You can now login to your account!');
    console.log('🌐 Go to: http://localhost:5000');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n💡 The users table does not exist yet.');
      console.log('   Run: npm run db:push');
    }
  } finally {
    await pool.end();
  }
}

// Run the script
setupSuperAdmin().catch(console.error); 