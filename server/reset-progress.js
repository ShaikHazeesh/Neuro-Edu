// Script to reset progress for Python Fundamentals course
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the database path
const dbPath = path.resolve(__dirname, '../dev.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Connect to the database
const db = new Database(dbPath);

// Find the Python Fundamentals course
const pythonCourse = db.prepare('SELECT * FROM courses WHERE title = ?').get('Python Fundamentals');

if (!pythonCourse) {
  console.error('Python Fundamentals course not found');
  process.exit(1);
}

console.log(`Found Python Fundamentals course with ID: ${pythonCourse.id}`);

// Find all user progress records for this course
const progressRecords = db.prepare('SELECT * FROM user_progress WHERE courseId = ?').all(pythonCourse.id);

console.log(`Found ${progressRecords.length} progress records for Python Fundamentals course`);

// Reset progress for all users
const resetStmt = db.prepare(`
  UPDATE user_progress
  SET progress = 0,
      completedLessons = 0,
      quizzesPassed = 0
  WHERE courseId = ?
`);

const result = resetStmt.run(pythonCourse.id);
console.log(`Reset progress for ${result.changes} users`);

// Close the database connection
db.close();

console.log('Progress reset complete!');
