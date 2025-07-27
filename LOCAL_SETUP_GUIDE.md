# 🚀 Local Development Setup Guide
## TimePaceSage (AgroLink) with Neon Database

---

## 📋 Prerequisites

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Neon Database** account (free tier available)
- **Git** for version control

---

## 🗄️ Step 1: Set up Neon Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

### 1.2 Get Database Connection String
1. In your Neon dashboard, go to **Connection Details**
2. Copy the **Connection string** (it looks like this):
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### 1.3 Update Environment Variables
1. Open the `.env` file in your project root
2. Replace the placeholder with your actual Neon connection string:
   ```env
   DATABASE_URL=postgresql://your-actual-username:your-actual-password@your-actual-host/your-actual-database?sslmode=require
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   PORT=5000
   ```

---

## 🛠️ Step 2: Install Dependencies

```bash
npm install
```

---

## 🗃️ Step 3: Set up Database Schema

### 3.1 Push Schema to Neon
```bash
npm run db:push
```

This will create all the necessary tables in your Neon database.

### 3.2 Verify Database Connection
The application will automatically connect to your Neon database when you start it.

---

## 🚀 Step 4: Start Development Server

### Option 1: Using the start script
```bash
npm run dev
```

### Option 2: Using the custom start script
```bash
node start-dev.js
```

### Option 3: Manual start
```bash
npm run dev:tsx
```

---

## 🌐 Step 5: Access Your Application

1. **Frontend**: Open [http://localhost:5000](http://localhost:5000)
2. **API Endpoints**: Available at `http://localhost:5000/api/*`

---

## 👤 Step 6: Create Your First User

### 6.1 Register a New Account
1. Open the application in your browser
2. Click "Create Account"
3. Fill in your details:
   - **Phone**: Your phone number (e.g., +237612345678)
   - **PIN**: 4-digit PIN (e.g., 1234)
   - **Name**: Your full name
   - **Region**: Select your region

### 6.2 Create a Super Admin (Optional)
If you want admin access, run:
```bash
node create-super-admin.js
```

---

## 🔧 Troubleshooting

### Database Connection Issues
- **Error**: "DATABASE_URL not set"
  - **Solution**: Check your `.env` file and ensure DATABASE_URL is correct

- **Error**: "Connection failed"
  - **Solution**: Verify your Neon connection string and network connectivity

### Port Already in Use
- **Error**: "Port 5000 already in use"
  - **Solution**: Change PORT in `.env` file or kill the process using port 5000

### Dependencies Issues
- **Error**: "Module not found"
  - **Solution**: Run `npm install` again

---

## 📱 Testing the Application

### 1. Authentication
- ✅ Register new account
- ✅ Login with PIN
- ✅ Session management

### 2. Tontine Features
- ✅ Create tontine group
- ✅ Join existing tontine
- ✅ Make contributions
- ✅ View group progress

### 3. Market Features
- ✅ View crop prices
- ✅ Submit price updates
- ✅ Premium features

### 4. Weather Features
- ✅ Current weather display
- ✅ Weather alerts
- ✅ Regional forecasts

### 5. Community Features
- ✅ Create posts
- ✅ Like and comment
- ✅ Regional feeds

---

## 🔒 Security Notes

1. **Never commit your `.env` file** to version control
2. **Change the JWT_SECRET** in production
3. **Use strong passwords** for your Neon database
4. **Enable SSL** for database connections (already configured)

---

## 📊 Database Schema Overview

Your Neon database will contain these main tables:
- `users` - User accounts and profiles
- `tontines` - Savings groups
- `tontine_members` - Group membership
- `tontine_payments` - Payment records
- `market_prices` - Crop pricing data
- `community_posts` - Social posts
- `weather_alerts` - Weather notifications
- `support_tickets` - Help requests

---

## 🎯 Next Steps

1. **Explore the UI**: Navigate through all features
2. **Test Mobile Responsiveness**: Use browser dev tools
3. **Check API Endpoints**: Use tools like Postman
4. **Review Code Structure**: Understand the architecture
5. **Plan Customizations**: Identify areas for enhancement

---

## 🆘 Need Help?

- Check the console for error messages
- Review the `README.md` for additional information
- Check the `AGROLINK_VISION.md` for project overview
- Database issues? Check Neon dashboard logs

---

**🎉 Congratulations! Your TimePaceSage application is now running locally with Neon database!** 