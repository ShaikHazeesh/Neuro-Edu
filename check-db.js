import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the database path
const dbPath = path.resolve(__dirname, 'dev.db');

// Connect to the database
const db = new Database(dbPath);

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in database:', tables);

// For each table, show its structure
for (const table of tables) {
  console.log(`\nStructure of table ${table.name}:`);
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log(columns);
  
  // Show a sample of data
  console.log(`\nSample data from ${table.name}:`);
  try {
    const rows = db.prepare(`SELECT * FROM ${table.name} LIMIT 3`).all();
    console.log(rows);
  } catch (error) {
    console.error(`Error fetching data from ${table.name}:`, error.message);
  }
}

// Close the database connection
db.close();
