import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { users, userProgress, quizResults, userActivity } from "../shared/schema";
import path from "path";
import fs from "fs";
import { config } from "dotenv";

// Load environment variables
config();

let db: any;
let sqlite: any;

// Set up the database
function setupDatabase() {
  try {
    // Use environment variable for database URL if available
    const dbUrl = process.env.DATABASE_URL;
    console.log(`Database URL from env: ${dbUrl}`);
    
    let dbPath = "dev.db";
    
    // If a specific path is provided in the environment variable
    if (dbUrl && dbUrl.startsWith("file:")) {
      dbPath = dbUrl.replace("file:", "");
    }
    
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    console.log(`Using database at path: ${dbPath}`);
    
    // Create SQLite database connection
    sqlite = new Database(dbPath);
    db = drizzle(sqlite);
    return db;
  } catch (error) {
    console.error("Error setting up database:", error);
    throw error;
  }
}

// Function to ensure tables are created
async function ensureTables() {
  try {
    // Check if user_activity table exists
    const tableExists = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_activity'")
      .get();
      
    if (!tableExists) {
      console.log("Creating user_activity table...");
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user_activity (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          related_id INTEGER DEFAULT 0,
          duration INTEGER,
          activity_type TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      console.log("user_activity table created successfully");
    } else {
      console.log("user_activity table already exists");
    }
    
    // Check if quiz_results table exists and if it has time_taken column
    const quizResultsExist = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='quiz_results'")
      .get();
      
    if (quizResultsExist) {
      // Check if time_taken column exists
      try {
        const columnExists = sqlite
          .prepare("SELECT time_taken FROM quiz_results LIMIT 1")
          .get();
          
        console.log("time_taken column already exists in quiz_results table");
      } catch (error) {
        // Column doesn't exist, add it
        console.log("Adding time_taken column to quiz_results table...");
        try {
          sqlite.exec(`ALTER TABLE quiz_results ADD COLUMN time_taken INTEGER`);
          console.log("time_taken column added to quiz_results table");
        } catch (alterError) {
          console.error("Error adding time_taken column:", alterError);
        }
      }
    } else {
      console.log("quiz_results table does not exist yet - it will be created when needed");
    }
    
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
  }
}

// Initialize the database
db = setupDatabase();

// Export the database and functions
export { db, ensureTables, sqlite };

// This function can be called during startup to ensure DB connection
export async function connectDB() {
  try {
    // Test the connection by executing a simple query
    const result = sqlite.prepare("SELECT 1 as connected").get();
    console.log("Database connected successfully");

    // Ensure all tables exist
    await ensureTables();
    
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}