Distribex – FMCG Distribution Management System

Distribex is a scalable, full-stack FMCG distribution management platform designed to streamline supply chain operations. It automates inventory control, expiry tracking, and dynamic pricing to minimize waste and improve operational efficiency.

Built with a modern tech stack, Distribex focuses on real-world business automation, scalability, and clean system design.

🚀 Key Features
🔹 Inventory & Stock Management

Real-time inventory tracking with automated low-stock alerts

Centralized product and stock control for efficient operations

🔹 Smart Expiry Management

Background cron jobs to detect near-expiry products

Prevents revenue loss and reduces product wastage

🔹 Dynamic Discounting

Automatic, configurable discounts applied based on product shelf-life

Helps accelerate sales of time-sensitive inventory

🔹 Role-Based Access Control (RBAC)

Separate dashboards for Admin, Staff, and Customers

Secure access control tailored to business roles

🔹 Business Analytics

Interactive dashboards showing sales, revenue, and inventory insights

Enables data-driven decision making

🔹 End-to-End E-commerce Workflow

Product browsing and search

Persistent shopping cart

Secure checkout and order management

🛠 Tech Stack

Frontend

React.js

TypeScript

Vite

Tailwind CSS

shadcn/ui

Framer Motion

Backend

Node.js

Express.js

Database & ORM

PostgreSQL (Neon Serverless)

Drizzle ORM (type-safe queries & shared schema)

State Management

TanStack Query (React Query)

Authentication

Passport.js (session-based authentication)

📦 Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/yourusername/distribex-fmcg-system.git
cd distribex-fmcg-system

2️⃣ Install dependencies
npm install

3️⃣ Environment Variables

Create a .env file in the root directory and add:

DATABASE_URL=your_postgresql_connection_string

4️⃣ Initialize Database
npm run db:push

5️⃣ Seed Demo Data
npm run seed

6️⃣ Run the application
npm run dev


The application will be available at:
👉 http://localhost:5000

📈 Architecture Overview

Distribex follows a modern client–server architecture with a shared schema for end-to-end type safety.
Time-sensitive operations such as expiry detection and discount updates are handled using scheduled background jobs, ensuring automation and reliability across business workflows.
