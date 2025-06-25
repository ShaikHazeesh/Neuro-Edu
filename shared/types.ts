import { User, Course, UserProgress as DrizzleUserProgress, Quiz, UserProgressWithDate } from './schema';

/**
 * Extended interfaces with improved type handling for dates and nullable fields
 */

// Fix SafeUser interface to handle lastStreak properly
export interface SafeUser extends Omit<User, 'password' | 'lastStreak'> {
  password?: never;
  lastStreak: string | null;
}

export interface UserProgressRecord extends Omit<DrizzleUserProgress, 'lastAccessed'> {
  lastAccessed: string;
  userId: number;
  courseId: number;
  lessonId: number | null;
  progress: number;
  completed: boolean;
  quizzesPassed: number;
  completedLessons: number;
}

export interface QuizSubmission {
  score: number;
  answers: Record<string, string | string[]>;
  timeTaken: number;
  courseId: number;
}

export interface QuizResult {
  success: boolean;
  score: number;
  passed?: boolean;
  message?: string;
  streak?: number;
  offlineMode?: boolean;
}

export interface CourseWithProgress extends Course {
  progress?: {
    completed: boolean;
    percentage: number;
    lastAccessed: string;
  };
}

/**
 * Utility functions for date handling
 */

/**
 * Formats a Date, string, or null/undefined into a string
 * Useful when we need to ensure consistency in data storage
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString(); // Default to current time
  
  // If date is already a string, return it
  if (typeof date === 'string') return date;
  
  // Otherwise format the Date object
  return date.toISOString();
}

/**
 * Parses a string or Date into a Date object or returns null if invalid
 */
export function parseDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  
  // If already a Date object, return it
  if (dateStr instanceof Date) return dateStr;
  
  // Try to parse the string into a Date
  try {
    const parsedDate = new Date(dateStr);
    return !isNaN(parsedDate.getTime()) ? parsedDate : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Checks if a value is a valid date
 */
export function isValidDate(value: any): boolean {
  if (!value) return false;
  
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  return false;
}

/**
 * Safely compares two dates (can be string or Date objects)
 * Returns true if the dates are the same day, false otherwise
 */
export function isSameDay(date1: string | Date | null, date2: string | Date | null): boolean {
  if (!date1 || !date2) return false;
  
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  
  if (!d1 || !d2) return false;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}
