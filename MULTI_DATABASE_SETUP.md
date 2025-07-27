# AgroLink Multi-Database Architecture Setup Guide

## Overview

This guide explains how to set up and configure AgroLink's multi-database architecture that leverages different databases for their specific strengths:

- **PostgreSQL/Neon**: Core business logic and structured data
- **Firebase**: Authentication, real-time features, and notifications
- **Supabase**: Analytics, reporting, and complex queries

## Architecture Benefits

### Performance Optimization
- **Real-time dashboards** via Firebase
- **Complex analytics** via Supabase
- **Reliable core data** via PostgreSQL
- **Automatic failover** and data synchronization

### Cost Efficiency
- **Free tiers** for all databases
- **Scalable pricing** as you grow
- **No vendor lock-in** with multiple options

### Development Flexibility
- **Best tool for each job**
- **Easy testing** with local alternatives
- **Gradual migration** capabilities

## Database Configuration

### 1. Environment Variables

Add these to your `.env` file:

```env
# Primary Database (PostgreSQL/Neon)
DATABASE_URL=your-neon-connection-string

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: PocketBase for local development
POCKETBASE_URL=http://localhost:8090
```

### 2. Database Setup

#### PostgreSQL/Neon (Primary Database)
```sql
-- Core tables are already defined in shared/schema.ts
-- Run migrations to create tables
npm run db:migrate
```

#### Firebase Collections
```javascript
// These collections will be created automatically
collections: {
  'user_profiles': {},           // User data sync
  'sessions': {},                // Active sessions
  'notifications': {},           // User notifications
  'admin_notifications': {},     // Admin alerts
  'resetRequests': {},           // Password/PIN reset
  'user_activities': {},         // Activity logging
  'backups': {},                 // Data backups
  'notification_templates': {},  // Notification templates
  'health': {},                  // Health checks
}
```

#### Supabase Tables
```sql
-- Analytics tables
CREATE TABLE user_analytics (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE market_analytics (
  id SERIAL PRIMARY KEY,
  price_id INTEGER,
  crop TEXT,
  price DECIMAL,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE tontine_analytics (
  id SERIAL PRIMARY KEY,
  tontine_id INTEGER,
  member_count INTEGER,
  total_funds DECIMAL,
  status TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_analytics (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  posts INTEGER,
  likes INTEGER,
  topic TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_analytics (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER,
  category TEXT,
  status TEXT,
  resolution_time INTEGER,
  satisfaction_score INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_analytics (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  notification_type TEXT,
  title TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE real_time_analytics (
  id SERIAL PRIMARY KEY,
  action TEXT,
  user_id TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Health check table
CREATE TABLE health_check (
  id SERIAL PRIMARY KEY,
  status TEXT DEFAULT 'healthy',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## Service Integration

### 1. Authentication Service (`server/auth-service.ts`)

Handles user authentication across all databases:

```typescript
// Features:
- Multi-database user authentication
- Session management with Firebase real-time sync
- Password/PIN reset with Firebase
- Activity logging to Supabase
- Automatic data synchronization
```

### 2. Analytics Service (`server/analytics-service.ts`)

Provides comprehensive analytics using Supabase:

```typescript
// Features:
- User behavior analytics
- Market price trends
- Tontine performance metrics
- Community engagement analysis
- Support ticket analytics
- Real-time dashboard data
```

### 3. Notification Service (`server/notification-service.ts`)

Manages notifications using Firebase:

```typescript
// Features:
- Real-time push notifications
- Admin alerts and system notifications
- Notification templates
- Bulk notification sending
- Analytics tracking
```

### 4. Database Manager (`server/database-config.ts`)

Coordinates all database connections:

```typescript
// Features:
- Health monitoring
- Connection pooling
- Automatic failover
- Data synchronization
- Backup management
```

## API Endpoints

### Authentication Endpoints
```typescript
POST /api/auth/login          // Multi-database authentication
POST /api/auth/logout         // Session cleanup
POST /api/auth/reset-request  // Password/PIN reset
POST /api/auth/reset-verify   // Verify reset code
POST /api/auth/reset-password // Complete reset
```

### Analytics Endpoints
```typescript
GET /api/analytics/comprehensive  // Full analytics dashboard
GET /api/analytics/users          // User metrics
GET /api/analytics/market         // Market analytics
GET /api/analytics/tontines       // Tontine metrics
GET /api/analytics/community      // Community analytics
GET /api/analytics/support        // Support metrics
GET /api/analytics/realtime       // Real-time data
GET /api/analytics/export         // Export analytics data
```

### Notification Endpoints
```typescript
GET /api/notifications/user       // Get user notifications
GET /api/notifications/admin      // Get admin notifications
POST /api/notifications/send      // Send notification
POST /api/notifications/bulk      // Send bulk notifications
POST /api/notifications/system    // Send system notification
PUT /api/notifications/read       // Mark as read
DELETE /api/notifications/:id     // Delete notification
```

## Data Flow Examples

### User Login Flow
1. **Primary DB**: Validate credentials
2. **Firebase**: Create real-time session
3. **Supabase**: Log login activity
4. **Firebase**: Sync user profile
5. **Response**: Return session token

### Market Price Update
1. **Primary DB**: Store price data
2. **Firebase**: Send real-time notification
3. **Supabase**: Update analytics
4. **Cache**: Invalidate price cache
5. **Response**: Return updated data

### Tontine Payment
1. **Primary DB**: Process payment
2. **Firebase**: Notify members
3. **Supabase**: Update financial analytics
4. **Cache**: Update tontine cache
5. **Response**: Return payment status

## Monitoring and Maintenance

### Health Checks
```typescript
// Automatic health monitoring every 5 minutes
- Database connectivity
- Service availability
- Performance metrics
- Error tracking
```

### Backup Strategy
```typescript
// Automated backups
- Primary DB: Daily SQL dumps
- Firebase: Automatic backups
- Supabase: Built-in backup system
- Local: PocketBase for testing
```

### Performance Optimization
```typescript
// Caching strategy
- Redis/Memory cache for frequent queries
- Firebase cache for real-time data
- Supabase cache for analytics
- CDN for static assets
```

## Development Workflow

### Local Development
1. **Primary DB**: Use Neon free tier
2. **Firebase**: Use Firebase emulator
3. **Supabase**: Use local Docker setup
4. **Testing**: Use PocketBase for isolated testing

### Production Deployment
1. **Primary DB**: Neon production instance
2. **Firebase**: Production project
3. **Supabase**: Production project
4. **Monitoring**: Health checks and alerts

### Testing Strategy
```typescript
// Test each database independently
- Unit tests for each service
- Integration tests for data flow
- End-to-end tests for user scenarios
- Performance tests for analytics
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check environment variables
echo $DATABASE_URL
echo $FIREBASE_PROJECT_ID
echo $SUPABASE_URL

# Test connections
npm run test:db-connections
```

#### Sync Issues
```bash
# Check data consistency
npm run check:data-sync

# Force sync
npm run sync:all-data
```

#### Performance Issues
```bash
# Monitor cache performance
npm run monitor:cache

# Check database performance
npm run monitor:db-performance
```

### Debug Commands
```bash
# Health check
curl http://localhost:5000/api/health

# Database status
curl http://localhost:5000/api/admin/db-status

# Analytics test
curl http://localhost:5000/api/analytics/realtime

# Notification test
curl -X POST http://localhost:5000/api/notifications/test
```

## Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted
- **Access Control**: Role-based permissions
- **Audit Logs**: All actions logged
- **Backup Security**: Encrypted backups

### API Security
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs
- **CORS**: Configured for security
- **HTTPS**: Enforced in production

## Scaling Strategy

### Horizontal Scaling
- **Load Balancers**: Distribute traffic
- **Database Sharding**: Split data by region
- **CDN**: Global content delivery
- **Microservices**: Split by functionality

### Vertical Scaling
- **Database Upgrades**: Increase resources
- **Caching Layers**: Reduce database load
- **Query Optimization**: Improve performance
- **Index Optimization**: Speed up queries

## Cost Optimization

### Free Tier Usage
- **Neon**: 3GB storage, 10GB transfer
- **Firebase**: 1GB storage, 50K reads/day
- **Supabase**: 500MB storage, 2GB transfer
- **PocketBase**: Unlimited (self-hosted)

### Paid Tier Planning
- **Monitor Usage**: Track resource consumption
- **Optimize Queries**: Reduce database calls
- **Cache Aggressively**: Minimize external calls
- **Batch Operations**: Group related operations

## Next Steps

1. **Set up environment variables**
2. **Configure database connections**
3. **Run database migrations**
4. **Test all services**
5. **Deploy to production**
6. **Monitor performance**
7. **Scale as needed**

## Support

For issues or questions:
- Check the troubleshooting section
- Review the API documentation
- Test with the provided scripts
- Monitor the health endpoints
- Contact the development team

---

**Note**: This multi-database architecture provides maximum flexibility and performance while maintaining cost efficiency. Each database serves its specific purpose, creating a robust and scalable system for AgroLink. 