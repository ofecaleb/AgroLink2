import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function createSuperAdmin() {
  try {
    console.log("Creating super admin account...");
    
    // Hash the password and PIN
    const hashedPassword = await bcrypt.hash("Agro#2025!FarmX9", 10);
    const hashedPin = await bcrypt.hash("7294", 10);
    
    // Create the super admin user using direct SQL
    const result = await sql`
      INSERT INTO users (
        phone, 
        email, 
        pin,
        password, 
        name, 
        country, 
        region, 
        language, 
        currency, 
        plan, 
        role, 
        balance, 
        last_active, 
        created_at, 
        updated_at
      ) VALUES (
        '683273200',
        'ofecaleb3@gmail.com',
        ${hashedPin},
        ${hashedPassword},
        'OFE CALEB CEO SA 👑',
        'Cameroon',
        'Yaounde',
        'en',
        'USD',
        'enterprise',
        'super_admin',
        0,
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id, name, phone, email, role;
    `;
    
    const newUser = result[0];
    
    console.log("✅ Super admin account created successfully!");
    console.log("📱 Phone: 683273200");
    console.log("📧 Email: ofecaleb3@gmail.com");
    console.log("🔑 Password: Agro#2025!FarmX9");
    console.log("🔢 PIN: 7294");
    console.log("👑 Role: super_admin");
    console.log("🆔 User ID:", newUser.id);
    console.log("\nYou can now log in with these credentials!");
    
  } catch (error) {
    console.error("❌ Error creating super admin account:", error);
    
    // Check if user already exists
    if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
      console.log("⚠️  User with this phone number already exists!");
      console.log("You can try logging in with the existing account or use a different phone number.");
    }
  } finally {
    process.exit(0);
  }
}

// Run the script
createSuperAdmin(); 