import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Add connection error handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection timeout and retry logic
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export { pool };
export const db = drizzle({ client: pool, schema });
