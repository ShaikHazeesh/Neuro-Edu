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

// Update the Python Fundamentals course image
const updateResult = db.prepare(`
  UPDATE courses 
  SET image_url = ? 
  WHERE title = ?
`).run('https://res.cloudinary.com/dwaz8vzgx/image/upload/v1745836467/nwct9tamiwdid9lxdx6n.png', 'Python Fundamentals');

console.log(`Updated ${updateResult.changes} course(s)`);

// Verify the update
const course = db.prepare('SELECT * FROM courses WHERE title = ?').get('Python Fundamentals');
console.log('Updated course:', course);

// Close the database connection
db.close();

console.log('Course image update complete!');
