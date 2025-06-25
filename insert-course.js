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

// Check if Python Fundamentals course already exists
const existingCourse = db.prepare('SELECT * FROM courses WHERE title = ?').get('Python Fundamentals');

if (existingCourse) {
  console.log('Python Fundamentals course already exists, updating image URL...');
  
  // Update the image URL
  const updateResult = db.prepare(`
    UPDATE courses 
    SET image_url = ? 
    WHERE title = ?
  `).run('https://res.cloudinary.com/dwaz8vzgx/image/upload/v1745836467/nwct9tamiwdid9lxdx6n.png', 'Python Fundamentals');
  
  console.log(`Updated ${updateResult.changes} course(s)`);
} else {
  console.log('Python Fundamentals course does not exist, inserting new course...');
  
  // Insert the Python Fundamentals course
  const insertResult = db.prepare(`
    INSERT INTO courses (
      title, 
      description, 
      image_url, 
      level, 
      category, 
      duration, 
      lecture_count, 
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Python Fundamentals',
    'Learn Python basics with mental health breaks built into the curriculum.',
    'https://res.cloudinary.com/dwaz8vzgx/image/upload/v1745836467/nwct9tamiwdid9lxdx6n.png',
    'Beginner',
    'Python',
    '8 weeks',
    24,
    new Date().toISOString()
  );
  
  console.log(`Inserted new course with ID: ${insertResult.lastInsertRowid}`);
}

// Verify the course
const course = db.prepare('SELECT * FROM courses WHERE title = ?').get('Python Fundamentals');
console.log('Course in database:', course);

// Close the database connection
db.close();

console.log('Course update/insert complete!');
