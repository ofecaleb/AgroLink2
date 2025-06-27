# AgroLink - Digital Agricultural Community Platform

## Overview
AgroLink is a comprehensive digital platform designed to empower farmers through community finance, market access, and agricultural information sharing. The application combines traditional tontine savings groups with modern mobile money integration, real-time market prices, weather alerts, and community features specifically tailored for agricultural communities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom agricultural theme variables
- **Build Tool**: Vite for fast development and optimized production builds
- **Mobile-First Design**: Responsive design optimized for mobile devices with touch-friendly interfaces

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with structured error handling
- **Session Management**: JWT-based authentication with session timeout tracking
- **File Structure**: Modular separation between client, server, and shared code

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Centralized schema definitions in `/shared/schema.ts`
- **Migrations**: Drizzle Kit for database schema migrations

## Key Components

### Authentication System
- **PIN-based Authentication**: 4-digit PIN system designed for users with varying literacy levels
- **Phone Number Identification**: Primary user identification via phone numbers
- **Session Management**: Automatic session timeout with activity tracking
- **Role-based Access**: User and admin role distinctions

### Digital Tontine System
- **Group Management**: Create and join tontine savings groups
- **Automatic Rotation**: Systematic payout rotation among group members
- **Payment Integration**: Mobile money integration (MTN Mobile Money, Orange Money)
- **Fee Structure**: 2% platform fee on all transactions
- **Member Tracking**: Real-time tracking of contributions and payout positions

### Market Information System
- **Real-time Pricing**: Display of current crop prices by region
- **Price Submission**: Community-driven price updates with admin verification
- **Regional Filtering**: Location-based price information
- **Crop Categories**: Support for multiple agricultural products

### Weather & Agricultural Alerts
- **Weather Integration**: Current weather conditions and forecasts
- **Farming Alerts**: Seasonal and emergency agricultural notifications
- **Regional Targeting**: Location-specific weather and farming information

### Community Features
- **Discussion Forum**: Regional community posts and discussions
- **Knowledge Sharing**: Platform for farmers to share experiences and advice
- **Multilingual Support**: English and French language options

## Data Flow

### User Registration Flow
1. User provides phone number, PIN, name, and region
2. System validates input and checks for existing accounts
3. PIN is hashed and stored securely
4. User profile created with default settings

### Tontine Operation Flow
1. Leader creates tontine group with contribution amount
2. Members join group and are assigned payout positions
3. Monthly contributions are collected via mobile money
4. System tracks payments and automatically rotates payouts
5. Group completion triggers final distribution

### Payment Processing Flow
1. User initiates payment via mobile money
2. System calculates fees and creates payment record
3. External payment processor handles transaction
4. System updates balances and contribution status
5. Notifications sent to relevant parties

## External Dependencies

### Payment Integration
- **MTN Mobile Money API**: Primary payment method for MTN subscribers
- **Orange Money API**: Secondary payment method for Orange subscribers
- **Transaction Verification**: Real-time payment status tracking

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first styling framework

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast bundling for production builds
- **TypeScript**: Type safety across the entire application

## Deployment Strategy

### Production Environment
- **Platform**: Replit with autoscale deployment
- **Build Process**: Vite build for client, ESBuild for server
- **Port Configuration**: Server runs on port 5000, exposed on port 80
- **Database**: PostgreSQL 16 with automatic provisioning

### Development Environment
- **Hot Reloading**: Vite dev server with fast refresh
- **Error Handling**: Runtime error overlay for development
- **Database**: Shared database configuration between environments

### Environment Configuration
- **Database URL**: Required environment variable for database connection
- **JWT Secret**: Configurable secret for token signing
- **Payment API Keys**: Secure storage of payment provider credentials

## Changelog
- June 27, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.