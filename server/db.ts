import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Use environment variable for database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// This function can be called during startup to ensure DB connection
export async function connectDB() {
  try {
    // Test the connection by executing a simple query
    const result = await sql`SELECT 1 as connected`;
    console.log("Database connected successfully");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}