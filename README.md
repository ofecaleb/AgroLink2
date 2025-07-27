# TimePaceSage

A modern React/TypeScript application for managing tontines (rotating savings and credit associations) with community features, weather integration, and real-time updates.

## Features

- 🔐 **Authentication**: Secure user registration and login
- 💰 **Tontine Management**: Create and manage rotating savings groups
- 👥 **Community**: Social features with posts and interactions
- 🌤️ **Weather Integration**: Real-time weather data and alerts
- 📱 **Responsive Design**: Mobile-first design with PWA support
- 🎨 **Modern UI**: Beautiful interface built with Radix UI and Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: TanStack Query
- **Authentication**: JWT with bcrypt
- **Deployment**: Render

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd TimePaceSage001234567
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file with your database URL
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Deployment

### Render Deployment

1. Push your code to GitHub
2. Connect your repository to Render
3. Set up environment variables in Render dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production

4. Deploy! Render will automatically build and deploy your app.

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── server/                # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations
│   └── vite.ts           # Vite development setup
├── shared/               # Shared types and schemas
└── drizzle.config.ts     # Database configuration
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/tontines` - Get user's tontines
- `POST /api/tontines` - Create new tontine
- `GET /api/community/posts` - Get community posts
- `POST /api/community/posts` - Create new post
- `GET /api/weather/current` - Get current weather
- `GET /api/weather/alerts` - Get weather alerts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

# AgroLink Multi-Database Backend

## Setup

1. **Install dependencies:**
   ```sh
   npm install firebase-admin @supabase/supabase-js pocketbase
   ```

2. **Environment Variables (.env):**
   - Add your Supabase credentials:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     ```
   - Ensure your Firebase credentials are set up as before.

3. **PocketBase:**
   - Download PocketBase from https://pocketbase.io/
   - Run PocketBase locally:
     ```sh
     ./pocketbase serve
     ```
   - Access admin panel at http://localhost:8090/_/
   - Create collections: `users`, `resetRequests`

4. **Supabase:**
   - Create tables: `yields`, `tontines`, `market_prices` as needed for analytics.

5. **Run the backend:**
   ```sh
   npm run dev
   ```
   - The server will run on http://localhost:3001

## API Endpoints
- `GET /api/users/:id` - Get user from Firebase
- `POST /api/users` - Create user in Firebase
- `POST /api/reset-request` - Create reset request in Firebase
- `GET /api/yields?region=Cameroon` - Get yields from Supabase
- `POST /api/yields` - Insert yield into Supabase
- `POST /api/backup-users` - Backup user to PocketBase

## Testing
- Use Postman or curl to test endpoints.
- Update frontend to use these endpoints for all data operations.

## Data Sync
- For automated sync, use n8n (https://n8n.io/) or custom Node.js scripts.

## Security
- Never commit your .env file.
- Set up security rules in Firebase and Supabase dashboards. 