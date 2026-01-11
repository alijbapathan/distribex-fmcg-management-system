Distribex - FMCG Management System

Distribex is a robust, full-stack distribution management platform built to optimize FMCG supply chain operations. It automates critical business processes like inventory tracking, expiry management, and dynamic pricing based on product shelf-life.

🚀 Key Features

Automated Inventory Tracking: Real-time monitoring of stock levels with integrated alerts for low-stock items.

Smart Expiry Management: Automated background jobs to detect products nearing their expiry dates.

Dynamic Discounting Logic: Automatically applies configurable discounts to near-expiry items to reduce waste and accelerate sales.

Multi-Role Dashboards: Role-Based Access Control (RBAC) providing tailored experiences for Admins, Staff, and Customers.

Business Analytics: Visual insights into sales performance, revenue trends, and inventory health using interactive charts.

Complete E-commerce Workflow: Seamless product discovery, persistent shopping cart, and secure checkout process.

🛠 Tech Stack

Frontend: React.js, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion.

Backend: Node.js, Express.js.

Database: PostgreSQL (Neon Serverless).

ORM: Drizzle ORM for type-safe database interactions.

State Management: TanStack Query (React Query) for efficient data fetching and caching.

Authentication: Passport.js with session-based persistent login.

📦 Installation & Setup

Clone the repository:

git clone [https://github.com/yourusername/distribex-fmcg-system.git](https://github.com/yourusername/distribex-fmcg-system.git)
cd distribex-fmcg-system


Install dependencies:

npm install


Environment Variables:
Create a .env file in the root directory and add your PostgreSQL connection string:

DATABASE_URL=your_postgresql_connection_string


Initialize the Database:

npm run db:push


Seed Demo Data:

npm run seed


Run the application:

npm run dev


The app will be available at http://localhost:5000.

📈 Architecture

The system follows a modern client-server architecture with a shared schema for end-to-end type safety. Scheduled cron jobs handle time-sensitive tasks like expiry checking, ensuring the business logic remains automated and reliable.

Developed as a personal project to master scalable full-stack development and business automation.
