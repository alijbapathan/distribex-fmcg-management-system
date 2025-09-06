# Overview

This is a full-stack grocery distribution system designed for Hindustan Unilever (HUL) distribution agencies. The application provides a comprehensive e-commerce platform with role-based access control, automated inventory management, and real-time expiry tracking. Built with React frontend and Node.js/Express backend, it features JWT-based authentication, shopping cart functionality, admin dashboards, and automated discount application for near-expiry products.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and builds
- **Styling**: TailwindCSS with shadcn/ui component library for consistent, modern UI
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Data Visualization**: Recharts for admin dashboard analytics and charts

## Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **Email Services**: Nodemailer for email verification and notifications
- **Scheduled Jobs**: Node-cron for automated expiry checking and discount application
- **API Design**: RESTful API structure with role-based access control middleware

## Database Design
- **Users**: Supports multiple roles (customer, retailer, agency_admin, staff) with email verification
- **Products**: Comprehensive product management with category relationships, stock tracking, and expiry dates
- **Categories**: Hierarchical product categorization with slugs and icons
- **Shopping Cart**: Persistent cart system with item quantity and pricing
- **Orders**: Complete order management with status tracking and shipping information
- **Automated Features**: Near-expiry detection with automatic discount application

## Authentication & Authorization
- **Multi-role System**: Four distinct user roles with different access levels
- **JWT Tokens**: Secure token-based authentication with refresh token support
- **Email Verification**: Required email verification for new user accounts
- **Password Security**: Bcrypt hashing with salt for password storage
- **Protected Routes**: Frontend route protection based on authentication status and user roles

## Key Features
- **Inventory Management**: Real-time stock tracking with low-stock alerts
- **Expiry Management**: Automated near-expiry detection with configurable discount application
- **E-commerce Flow**: Complete shopping cart, checkout, and order management system
- **Admin Dashboard**: Comprehensive analytics with charts, metrics, and management tools
- **Indian Localization**: INR currency formatting throughout the application
- **Responsive Design**: Mobile-first design with responsive layouts

# External Dependencies

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **Connection Pooling**: Neon serverless connection pooling for optimal performance

## Authentication Services
- **Email Verification**: SMTP-based email service for user verification
- **Session Storage**: PostgreSQL-backed session storage using connect-pg-simple

## UI Components
- **Radix UI**: Accessible, unstyled UI primitives for consistent behavior
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **Font Awesome**: Additional icons for category representations

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Specialized plugins for Replit development environment

## External APIs & Services
- **Email Service**: Configurable SMTP service for email notifications
- **File Storage**: Image handling for product photos and user avatars
- **Google Fonts**: Inter font family for typography consistency