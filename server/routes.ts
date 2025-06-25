// Type declaration for node-fetch
declare module 'node-fetch';

// Add this type override to fix compatibility issues
interface CompatibleAbortSignal {
  aborted: boolean;
  onabort: ((this: AbortSignal, ev: Event) => any) | null;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  dispatchEvent: (event: Event) => boolean;
  // Add missing properties required for compatibility
  reason?: any;
  throwIfAborted?: () => void;
}

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  insertChatMessageSchema,
  Course,
  Module,
  Lesson,
  ForumPost,
  ForumComment,
  QuizResult as SchemaQuizResult,
  UserProgress
} from "@shared/schema";
import fetch from "node-fetch";
// Use global AbortController - no need for external package
// import AbortController from "abort-controller";
import { setupAuth } from "./auth";
import codePlaygroundRoutes from "./code-playground";
import {
  UserProgressRecord,
  SafeUser,
  QuizSubmission,
  QuizResult,
  formatDate,
  parseDate
} from '../shared/types';
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { quizResults } from "../shared/schema";

// Authentication middleware for protected routes
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Define an interface for the progress item
interface ProgressItem {
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  courseImage: string;
  progress: number;
  completedLessons: number;
  quizzesPassed: number;
  lastAccessed: string | null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // prefix all routes with /api
  const apiRouter = app;

  // Register code playground routes
  apiRouter.use('/api/code', codePlaygroundRoutes);

  // Add a simple debug endpoint
  apiRouter.get("/api/debug", (req, res) => {
    console.log("Debug endpoint called");
    res.json({
      message: "API is working",
      time: new Date().toISOString(),
      auth: {
        isAuthenticated: req.isAuthenticated(),
        user: req.isAuthenticated() ? req.user : null
      },
      session: {
        id: req.sessionID,
        cookie: req.session?.cookie
      }
    });
  });

  // Add a debug endpoint to fix JavaScript Essentials progress
  apiRouter.get("/api/debug/fix-js-progress", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = (req.user as Express.User).id;

      // Find the JavaScript Essentials course
      const courses = await storage.getCourses();
      const jsCourse = courses.find((c: any) => c.title.toLowerCase().includes("javascript"));

      if (!jsCourse) {
        return res.status(404).json({ message: "JavaScript course not found" });
      }

      console.log(`Found JavaScript course: ${jsCourse.title} (ID: ${jsCourse.id})`);

      // Get all completed lessons for this user and course
      const completedLessons = await storage.getCompletedLessons(userId, jsCourse.id);
      console.log(`Found ${completedLessons.length} completed lessons for JavaScript course`);

      // Recalculate progress for this course
      const updatedProgress = await storage.recalculateCourseProgress(userId, jsCourse.id);

      res.json({
        message: `Fixed progress for JavaScript Essentials course`,
        courseId: jsCourse.id,
        completedLessons: completedLessons.length,
        progress: updatedProgress?.progress || 0
      });
    } catch (error) {
      console.error("Error fixing JavaScript progress:", error);
      res.status(500).json({ message: "Failed to fix JavaScript progress" });
    }
  });

  // Add a reset progress endpoint
  apiRouter.get("/api/debug/reset-progress/:courseTitle", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = (req.user as Express.User).id;
      const courseTitle = req.params.courseTitle;

      // Find the course by title
      const courses = await storage.getCourses();
      const course = courses.find((c: any) => c.title.toLowerCase() === courseTitle.toLowerCase());

      if (!course) {
        return res.status(404).json({ message: `Course '${courseTitle}' not found` });
      }

      // Get the user's progress for this course
      const userProgress = await storage.getUserProgress(userId, course.id);

      if (!userProgress) {
        return res.status(404).json({ message: "No progress found for this course" });
      }

      // Reset the progress
      await storage.updateUserProgress({
        ...userProgress,
        progress: 0,
        completedLessons: 0,
        quizzesPassed: 0
      });

      res.json({
        message: `Progress for course '${courseTitle}' has been reset`,
        course: course.id,
        userId
      });
    } catch (error) {
      console.error("Error resetting progress:", error);
      res.status(500).json({ message: "Failed to reset progress" });
    }
  });

  // Debug endpoint to recalculate progress for all courses
  apiRouter.get("/api/debug/recalculate-progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;

      console.log(`Recalculating progress for user ${userId}`);

      // Get all courses
      const courses = await storage.getCourses();
      const results = [];

      // Process each course
      for (const course of courses) {
        try {
          // Get existing progress
          const existingProgress = await storage.getUserProgress(userId, course.id);

          if (existingProgress) {
            const oldProgress = existingProgress.progress || 0;

            // Get completed lessons and quizzes
            const completedLessons = await storage.getCompletedLessons(userId, course.id);
            const userQuizResults = await storage.getUserQuizResults(userId);
            const courseQuizzes = await storage.getQuizzesByCourseId(course.id);

            // Count passed quizzes
            const passedQuizzes = userQuizResults.filter(result =>
              result.courseId === course.id && result.passed
            ).length;

            // Update progress
            const updatedProgress = {
              ...existingProgress,
              completedLessons: completedLessons.length,
              quizzesPassed: passedQuizzes
            };

            await storage.updateUserProgress(updatedProgress);

            // Get the newly calculated progress
            const refreshedProgress = await storage.getUserProgress(userId, course.id);

            results.push({
              courseId: course.id,
              courseTitle: course.title,
              status: 'updated',
              oldProgress,
              newProgress: refreshedProgress?.progress || 0,
              completedLessons: completedLessons.length,
              quizzesPassed: passedQuizzes
            });
          } else {
            // No existing progress found, create if there's any activity
            const completedLessons = await storage.getCompletedLessons(userId, course.id);
            const userQuizResults = await storage.getUserQuizResults(userId);
            const passedQuizzes = userQuizResults.filter(result =>
              result.courseId === course.id && result.passed
            ).length;

            if (completedLessons.length > 0 || passedQuizzes > 0) {
              // Create new progress
              await storage.updateUserProgress({
                userId,
                courseId: course.id,
                completedLessons: completedLessons.length,
                quizzesPassed: passedQuizzes,
                lastAccessed: new Date().toISOString()
              });

              const newProgress = await storage.getUserProgress(userId, course.id);

              results.push({
                courseId: course.id,
                courseTitle: course.title,
                status: 'created',
                oldProgress: 0,
                newProgress: newProgress?.progress || 0,
                completedLessons: completedLessons.length,
                quizzesPassed: passedQuizzes
              });
            } else {
              // No activity for this course
              results.push({
                courseId: course.id,
                courseTitle: course.title,
                status: 'skipped',
                message: 'No activity found for this course'
              });
            }
          }
        } catch (courseError) {
          console.error(`Error processing course ${course.id}:`, courseError);
          results.push({
            courseId: course.id,
            courseTitle: course.title,
            status: 'error',
            message: 'Failed to process course'
          });
        }
      }

      res.json({
        success: true,
        message: `Progress recalculated for ${results.filter(r => r.status === 'updated' || r.status === 'created').length} courses`,
        results
      });
    } catch (error) {
      console.error("Error recalculating progress:", error);
      res.status(500).json({ message: "Failed to recalculate progress" });
    }
  });

  // Add a test login endpoint for debugging
  apiRouter.post("/api/test-login", (req, res) => {
    console.log("Test login endpoint called", req.body);
    const { username, password } = req.body;

    // Do a very basic validation for testing
    if (username && password) {
      res.json({
        success: true,
        message: "Test login successful (not real auth)",
        username
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Please provide username and password for test"
      });
    }
  });

  // Error handling middleware
  const handleZodError = (err: any, res: any) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    throw err;
  };

  // Courses endpoints
  apiRouter.get("/api/courses", async (req, res) => {
    try {
      let courses = await storage.getCourses();

      // Handle filtering if needed
      const { category, level } = req.query;
      if (category && typeof category === 'string') {
        courses = courses.filter(c => c.category === category);
      }
      if (level && typeof level === 'string') {
        courses = courses.filter(c => c.level === level);
      }

      // Add real progress information if logged in
      let coursesWithProgress = courses;

      if (req.isAuthenticated()) {
        const userId = (req.user as Express.User).id;

        // Get progress for each course
        coursesWithProgress = await Promise.all(
          courses.map(async (course) => {
            const userProgress = await storage.getUserProgress(userId, course.id);

            // Verify progress is valid - ensure it's a number between 0-100
            let progress = 0;
            if (userProgress && userProgress.progress !== null && userProgress.progress !== undefined) {
              // Ensure progress is a valid number between 0-100
              progress = Math.min(100, Math.max(0, Number(userProgress.progress)));

              // Validate that the user has actually completed lessons or quizzes
              // If progress is 100% but no lessons or quizzes completed, reset to 0
              if (progress === 100 &&
                  (userProgress.completedLessons === 0 || userProgress.completedLessons === null) &&
                  (userProgress.quizzesPassed === 0 || userProgress.quizzesPassed === null)) {
                console.log(`Fixing invalid 100% progress for user ${userId}, course ${course.id} with no completed content`);
                progress = 0;

                // Update the stored progress to fix the issue
                await storage.updateUserProgress({
                  ...userProgress,
                  progress: 0
                });
              }
            }

            return {
              ...course,
              progress: progress,
              completedLessons: userProgress?.completedLessons || 0,
              quizzesPassed: userProgress?.quizzesPassed || 0
            };
          })
        );
      } else {
        // For non-authenticated users, set progress to 0
        coursesWithProgress = courses.map(course => ({
          ...course,
          progress: 0
        }));
      }

      res.json(coursesWithProgress);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  apiRouter.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get modules and lessons for this course
      const modules = await storage.getModulesByCourseId(courseId);
      const lessons = await storage.getLessonsByCourseId(courseId);

      // Get user progress if authenticated
      let progress = 0;
      let completedLessons = 0;
      let quizzesPassed = 0;

      if (req.isAuthenticated()) {
        const userId = (req.user as Express.User).id;
        const userProgress = await storage.getUserProgress(userId, courseId);

        if (userProgress) {
          // Ensure progress is a valid number between 0-100
          progress = Math.min(100, Math.max(0, Number(userProgress.progress || 0)));
          completedLessons = userProgress.completedLessons || 0;
          quizzesPassed = userProgress.quizzesPassed || 0;

          // Validate that the user has actually completed lessons or quizzes
          // If progress is 100% but no lessons or quizzes completed, reset to 0
          if (progress === 100 && completedLessons === 0 && quizzesPassed === 0) {
            console.log(`Fixing invalid 100% progress for user ${userId}, course ${courseId} with no completed content`);
            progress = 0;

            // Update the stored progress to fix the issue
            await storage.updateUserProgress({
              ...userProgress,
              progress: 0
            });
          }
        }
      }

      // Get completed lessons for this course if user is authenticated
      let completedLessonIds: number[] = [];
      if (req.isAuthenticated()) {
        const userId = (req.user as Express.User).id;
        const completedLessonsData = await storage.getCompletedLessons(userId, courseId);
        completedLessonIds = completedLessonsData.map(lesson => lesson.lessonId);
      }

      res.json({
        ...course,
        modules,
        lessons,
        progress,
        completedLessons,
        completedLessonIds,
        quizzesPassed
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course details" });
    }
  });

  // Get course lessons and modules
  apiRouter.get("/api/courses/:id/lessons", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get modules for this course
      const modules = await storage.getModulesByCourseId(courseId);

      // Get lessons for each module
      const modulesWithLessons = await Promise.all(modules.map(async (module) => {
        // Get all lessons for the course
        const allLessons = await storage.getLessonsByCourseId(courseId);

        // Filter lessons that belong to this module
        const moduleLessons = allLessons.filter((lesson: Lesson) => lesson.moduleId === module.id);

        // Sort lessons by order
        const sortedLessons = moduleLessons.sort((a: Lesson, b: Lesson) => a.order - b.order);

        return {
          ...module,
          lessons: sortedLessons
        };
      }));

      // Sort modules by order
      const sortedModules = modulesWithLessons.sort((a: Module, b: Module) => a.order - b.order);

      // Get completed lessons for this course if user is authenticated
      let completedLessonIds: number[] = [];
      if (req.isAuthenticated()) {
        const userId = (req.user as Express.User).id;
        const completedLessonsData = await storage.getCompletedLessons(userId, courseId);
        completedLessonIds = completedLessonsData.map(lesson => lesson.lessonId);
      }

      res.json({
        courseId,
        modules: sortedModules,
        completedLessonIds
      });
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      res.status(500).json({ message: "Failed to fetch course lessons" });
    }
  });

  // Lessons endpoints
  apiRouter.get("/api/lessons/featured", async (req, res) => {
    try {
      const featuredLesson = await storage.getFeaturedLesson();
      if (!featuredLesson) {
        return res.status(404).json({ message: "No featured lesson found" });
      }

      // Get the course this lesson belongs to
      const course = await storage.getCourse(featuredLesson.courseId);

      // Get the modules for this course
      const modules = await storage.getModulesByCourseId(featuredLesson.courseId);

      // Transform the modules with duration data
      const modulesWithDuration = modules.map(module => ({
        ...module,
        title: module.title,
        duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
      }));

      // Mock instructor data
      const instructor = {
        name: "Dr. Alex Morgan",
        title: "Computer Science Professor",
        avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
      };

      res.json({
        ...featuredLesson,
        courseName: course?.title,
        instructor,
        modules: modulesWithDuration
      });
    } catch (error) {
      console.error("Error fetching featured lesson:", error);
      res.status(500).json({ message: "Failed to fetch featured lesson" });
    }
  });

  apiRouter.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "Invalid lesson ID" });
      }

      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Get the quizzes for this lesson
      const quizzes = await storage.getQuizzesByLessonId(lessonId);

      res.json({
        ...lesson,
        quizzes
      });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson details" });
    }
  });

  // Check lesson completion status (protected)
  apiRouter.get("/api/lessons/:id/completion", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "Invalid lesson ID" });
      }

      // Get completion status
      const completion = await storage.getLessonCompletion(userId, lessonId);

      if (completion) {
        return res.json({
          completed: true,
          watchProgress: completion.watchProgress || 0,
          completedAt: completion.completedAt
        });
      } else {
        return res.json({
          completed: false,
          watchProgress: 0
        });
      }
    } catch (error) {
      console.error('Error checking lesson completion:', error);
      res.status(500).json({ success: false, message: 'Failed to check lesson completion' });
    }
  });

  // Update lesson watch progress (protected)
  apiRouter.post("/api/lessons/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const userId = req.user?.id;
      const { progress } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      if (isNaN(lessonId) || typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Update watch progress
      const updatedProgress = await storage.updateLessonWatchProgress(userId, lessonId, progress);

      // Check if the lesson is already marked as completed
      const isCompleted = updatedProgress?.completedAt ? true : false;

      return res.json({
        success: true,
        watchProgress: updatedProgress?.watchProgress || progress,
        completed: isCompleted
      });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      res.status(500).json({ success: false, message: 'Failed to update lesson progress' });
    }
  });

  // Mark lesson as completed (protected)
  apiRouter.post("/api/lessons/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "Invalid lesson ID" });
      }

      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      const courseId = lesson.courseId;

      // Record the lesson completion
      try {
        // Mark the lesson as completed in the completedLessons table
        const moduleId = lesson.moduleId;
        await storage.markLessonCompleted({
          userId,
          lessonId,
          courseId,
          moduleId,
          completedAt: formatDate(new Date()),
          watchProgress: 100
        });

        // The markLessonCompleted method will automatically update the user progress
        // by incrementing the completedLessons count

        // Record activity
        await storage.trackUserActivity({
          userId,
          type: 'lesson',
          message: `Completed lesson: ${lesson.title}`,
          // Convert string to Date for the trackUserActivity method
          timestamp: new Date(),
          relatedId: lessonId,
          duration: 600, // Assume lesson takes about 10 minutes
          activityType: 'study'
        });

        // Update user streak
        const streak = await storage.updateUserStreak(userId);
        console.log(`Updated streak for user ${userId} to ${streak}`);

        // Get the updated progress to return in the response
        const updatedUserProgress = await storage.getUserProgress(userId, courseId);

        res.json({
          success: true,
          message: 'Lesson marked as complete',
          progress: updatedUserProgress?.progress || 0,
          completedLessons: updatedUserProgress?.completedLessons || 0,
          streak: streak
        });
      } catch (err) {
        console.error('Error updating lesson progress:', err);
        res.status(500).json({ success: false, message: 'Failed to update lesson progress' });
      }
    } catch (err) {
      console.error('Error marking lesson as complete:', err);
      res.status(500).json({ success: false, message: 'Failed to mark lesson as complete' });
    }
  });

  // Quiz endpoints
  apiRouter.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }

      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz details" });
    }
  });

  // Original Quiz submission endpoint
  apiRouter.post("/api/quizzes/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const quizIdString = req.params.id;
      const quizId = parseInt(quizIdString);

      if (isNaN(quizId)) {
        return res.status(400).json({ error: 'Invalid quiz ID' });
      }

      const user = req.user as Express.User;
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get the request body and validate it
      const resultData = req.body;
      if (typeof resultData.score !== 'number' || resultData.score < 0 || resultData.score > 100) {
        return res.status(400).json({ error: 'Invalid score. Must be a number between 0 and 100.' });
      }

      // Get the quiz
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // Get course ID from the quiz
      const courseId = quiz.courseId;
      if (!courseId) {
        return res.status(400).json({ error: 'Quiz has no associated course' });
      }

      // Determine if the user passed the quiz
      const passingScore = quiz.passingScore || 70; // Default to 70%
      const isPassed = resultData.score >= passingScore;

      console.log(`Processing quiz submission for quiz ${quizId}, user ${user.id}, score ${resultData.score}%`);

      try {
        // 1. Save the quiz result first to ensure it's recorded
        console.log("Saving quiz result to database...");
        const savedResult = await storage.saveQuizResult({
          userId: user.id,
          quizId,
          courseId,
          score: resultData.score,
          passed: isPassed,
          answers: JSON.stringify(resultData.answers || {}),
          timeTaken: resultData.timeTaken || null
        });
        console.log(`Saved quiz result with ID: ${savedResult.id}`);

        // 2. Update user progress
        let updatedUserProgress;
        try {
          console.log(`Updating user progress for user ${user.id}, course ${courseId}`);
          const userProgress = await storage.getUserProgress(user.id, courseId);

          if (userProgress) {
            // Update existing progress
            const quizPassedBefore = userProgress.quizzesPassed || 0;
            const newQuizzesPassed = quizPassedBefore + (isPassed ? 1 : 0);

            updatedUserProgress = await storage.updateUserProgress({
              ...userProgress,
              quizzesPassed: newQuizzesPassed,
              lastAccessed: formatDate(new Date())
            });
            console.log(`Updated existing progress for user ${user.id}, quizzes passed: ${newQuizzesPassed}`);
          } else {
            // Create new progress
            updatedUserProgress = await storage.createUserProgress({
              userId: user.id,
              courseId,
              progress: 0,
              completedLessons: 0,
              quizzesPassed: isPassed ? 1 : 0,
              lastAccessed: formatDate(new Date())
            });
            console.log(`Created new progress for user ${user.id}, quizzes passed: ${isPassed ? 1 : 0}`);
          }
        } catch (progressError) {
          console.error("Error updating user progress:", progressError);
        }

        // 3. Track user activity
        try {
          console.log(`Tracking quiz activity for user ${user.id}`);
          await storage.trackUserActivity({
            userId: user.id,
            type: 'quiz',
            message: `Completed "${quiz.title}" quiz with score ${resultData.score}%${isPassed ? ' (Passed)' : ' (Failed)'}`,
            timestamp: new Date(),
            relatedId: quizId,
            duration: resultData.timeTaken || 300, // Default 5 minutes
            activityType: 'study'
          });
          console.log(`Successfully tracked quiz activity for user ${user.id}`);
        } catch (activityError) {
          console.error("Error tracking activity:", activityError);
        }

        // 4. Update user streak
        let streak = 0;
        try {
          console.log(`Updating user streak for user ${user.id}`);
          streak = await storage.updateUserStreak(user.id);
          console.log(`Updated streak for user ${user.id} to ${streak}`);
        } catch (streakError) {
          console.error("Error updating streak:", streakError);
        }

        // 5. Return result to client
        return res.json({
          success: true,
          passed: isPassed,
          score: resultData.score,
          passingScore,
          streak,
          result: savedResult,
          progress: updatedUserProgress?.progress || 0,
          quizzesPassed: updatedUserProgress?.quizzesPassed || 0
        });
      } catch (error) {
        console.error("Error processing quiz result:", error);
        return res.status(500).json({ error: "Failed to process quiz submission" });
      }
    } catch (error) {
      console.error("Error in quiz submission endpoint:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cheat sheets endpoints
  apiRouter.get("/api/cheatsheets", async (req, res) => {
    try {
      const cheatSheets = await storage.getCheatSheets();
      res.json(cheatSheets);
    } catch (error) {
      console.error("Error fetching cheat sheets:", error);
      res.status(500).json({ message: "Failed to fetch cheat sheets" });
    }
  });

  apiRouter.get("/api/cheatsheets/:id", async (req, res) => {
    try {
      const cheatSheetId = parseInt(req.params.id);
      if (isNaN(cheatSheetId)) {
        return res.status(400).json({ message: "Invalid cheat sheet ID" });
      }

      const cheatSheet = await storage.getCheatSheet(cheatSheetId);
      if (!cheatSheet) {
        return res.status(404).json({ message: "Cheat sheet not found" });
      }

      res.json(cheatSheet);
    } catch (error) {
      console.error("Error fetching cheat sheet:", error);
      res.status(500).json({ message: "Failed to fetch cheat sheet details" });
    }
  });

  // Forum endpoints (GET endpoints open, POST protected)
  apiRouter.get("/api/forum", async (req, res) => {
    try {
      const posts = await storage.getForumPosts();

      // Create response with user info but protect anonymity
      const postsWithUserInfo = posts.map(post => {
        if (post.anonymous) {
          return {
            ...post,
            username: "Anonymous",
            userAvatar: null
          };
        }

        // In a real app, fetch user details
        return {
          ...post,
          username: `User${post.userId}`,
          userAvatar: `https://i.pravatar.cc/150?u=${post.userId}`
        };
      });

      res.json(postsWithUserInfo);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  apiRouter.get("/api/forum/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Forum post not found" });
      }

      // Get comments for this post
      const comments = await storage.getPostComments(postId);

      // Format the post and comments with user info
      const formattedPost = post.anonymous
        ? { ...post, username: "Anonymous", userAvatar: null }
        : { ...post, username: `User${post.userId}`, userAvatar: `https://i.pravatar.cc/150?u=${post.userId}` };

      const formattedComments = comments.map(comment => {
        if (comment.anonymous) {
          return {
            ...comment,
            username: "Anonymous",
            userAvatar: null
          };
        }
        return {
          ...comment,
          username: `User${comment.userId}`,
          userAvatar: `https://i.pravatar.cc/150?u=${comment.userId}`
        };
      });

      res.json({
        post: formattedPost,
        comments: formattedComments
      });
    } catch (error) {
      console.error("Error fetching forum post:", error);
      res.status(500).json({ message: "Failed to fetch forum post details" });
    }
  });

  // Create new forum post (protected)
  apiRouter.post("/api/forum", isAuthenticated, async (req, res) => {
    try {
      const postSchema = z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        content: z.string().min(10, "Content must be at least 10 characters"),
        tags: z.array(z.string()).optional(),
        anonymous: z.boolean().optional()
      });

      const postData = postSchema.parse(req.body);
      const userId = (req.user as Express.User).id;

      // Convert tags array to a JSON string or null to match expected type
      const tagsAsString = postData.tags ? JSON.stringify(postData.tags) : null;

      const newPost = await storage.createForumPost({
        ...postData,
        userId,
        tags: tagsAsString
      });

      // Format the response
      const formattedPost = newPost.anonymous
        ? { ...newPost, username: "Anonymous", userAvatar: null }
        : { ...newPost, username: `User${newPost.userId}`, userAvatar: `https://i.pravatar.cc/150?u=${newPost.userId}` };

      res.status(201).json(formattedPost);
    } catch (error) {
      console.error("Error creating forum post:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  // Add comment to a post (protected)
  apiRouter.post("/api/forum/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      // Verify the post exists
      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Forum post not found" });
      }

      const commentSchema = z.object({
        content: z.string().min(1, "Comment cannot be empty"),
        anonymous: z.boolean().optional()
      });

      const commentData = commentSchema.parse(req.body);
      const userId = (req.user as Express.User).id;

      const newComment = await storage.createForumComment({
        ...commentData,
        userId,
        postId
      });

      // Format the response
      const formattedComment = newComment.anonymous
        ? { ...newComment, username: "Anonymous", userAvatar: null }
        : { ...newComment, username: `User${newComment.userId}`, userAvatar: `https://i.pravatar.cc/150?u=${newComment.userId}` };

      res.status(201).json(formattedComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // AI Chat endpoint with Groq API integration
  apiRouter.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      // Validate request body with message history
      const chatRequestSchema = z.object({
        message: z.string().min(1, "Message cannot be empty"),
        history: z.array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string()
          })
        ).optional()
      });

      const { message, history = [] } = chatRequestSchema.parse(req.body);
      const userId = (req.user as Express.User).id;

      let response;

      // Check if GROQ API key is available
      const apiKey = process.env.GROQ_API_KEY;

      if (apiKey) {
        try {
          // Prepare the messages array with history and current message
          const messages = [
            { role: 'system', content: 'You are a helpful AI assistant specializing in both programming education and mental health support for students. Provide clear, concise answers for programming questions and compassionate support for wellness concerns.' },
            ...history,
            { role: 'user', content: message }
          ];

          console.log("Sending request to Groq API with messages:", messages.length);

          // Call to Groq API using Llama model with timeout
          // Use global AbortController
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          try {
          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "llama3-8b-8192",  // Using Llama model
              messages,
              temperature: 0.7,
              max_tokens: 800
              }),
              // Use type assertion to bypass compatibility issues
              signal: controller.signal as any
          });

            clearTimeout(timeoutId);

          if (!groqResponse.ok) {
              console.error(`Groq API error: ${groqResponse.status} - ${await groqResponse.text()}`);
            throw new Error(`Groq API responded with status: ${groqResponse.status}`);
          }

          const data = await groqResponse.json();

          if (data.choices && data.choices[0] && data.choices[0].message) {
            response = data.choices[0].message.content;
              console.log("Received response from Groq API");
          } else {
              console.error("Unexpected Groq API response format:", data);
            throw new Error("Unexpected response format from Groq API");
          }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
          }
        } catch (error) {
          console.error("Error calling Groq API:", error);
          // Fall back to rule-based responses
          response = getFallbackResponse(message);
        }
      } else {
        // API key not available, use fallback responses
        response = getFallbackResponse(message);
      }

      // Save the chat message to storage
      await storage.saveChatMessage({
        userId,
        message,
        response,
        createdAt: formatDate(new Date()) // Convert to Date object
      });

      // Update streak when user interacts with the chatbot
      const streak = await storage.updateUserStreak(userId);

      res.json({ response, streak });
    } catch (error) {
      console.error("Error processing chat message:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Helper function to provide rule-based fallback responses
  function getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("python")) {
      return "Python is a high-level, interpreted programming language known for its readability and simplicity. It's great for beginners! Would you like me to help you with a specific Python concept?";
    } else if (lowerMessage.includes("javascript")) {
      return "JavaScript is a versatile language used for web development. It allows you to create interactive elements on websites. What specific aspect of JavaScript are you interested in learning?";
    } else if (lowerMessage.includes("stress") || lowerMessage.includes("anxiety") || lowerMessage.includes("overwhelm")) {
      return "It's normal to feel stressed when learning programming. Taking regular breaks, practicing mindfulness, and breaking tasks into smaller steps can help. Remember to be kind to yourself during this learning journey.";
    } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! I'm your AI assistant for both programming education and mental wellness. How can I help you today?";
    } else {
      return "I'm here to help with your programming questions and provide mental health support. What specific topic would you like to learn about today?";
    }
  }

  // Mood tracking endpoints (protected)
  apiRouter.post("/api/mood", isAuthenticated, async (req, res) => {
    try {
      const moodSchema = z.object({
        mood: z.enum(["Good", "Okay", "Struggling"]),
        journal: z.string().optional()
      });

      const moodData = moodSchema.parse(req.body);
      const userId = (req.user as Express.User).id;

      console.log("Saving mood entry:", { userId, ...moodData });

      const savedEntry = await storage.saveMoodEntry({
        userId,
        mood: moodData.mood,
        journal: moodData.journal || null
      });

      // Update streak when user logs mood
      const streak = await storage.updateUserStreak(userId);

      console.log("Mood entry saved successfully:", savedEntry);

      res.status(201).json({
        ...savedEntry,
        streak
      });
    } catch (error) {
      console.error("Error saving mood entry:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to save mood entry" });
    }
  });

  apiRouter.get("/api/mood", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const entries = await storage.getUserMoodEntries(userId);
      console.log(`Retrieved ${entries.length} mood entries for user ${userId}`);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  // Chat history endpoint
  apiRouter.get("/api/user/chat-history", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const chatHistory = await storage.getUserChatHistory(userId);
      res.json(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // User progress endpoint for dashboard
  apiRouter.get("/api/user/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const user = await storage.getUser(userId);
      const courses = await storage.getCourses();

      // Get all quiz results for this user
      const quizResultsData = await storage.getUserQuizResults(userId);

      // Debug the quiz results
      console.log(`Found ${quizResultsData.length} quiz results for user ${userId}`);
      if (quizResultsData.length > 0) {
        console.log('Quiz results data sample:', quizResultsData[0]);
      } else {
        console.log('No quiz results found. Checking if there was a database connection issue...');

        // If there's an issue with the database, we'll check memory storage
        try {
          // Check if there are any recent results by getting timestamps
          const recentActivity = await storage.getUserRecentActivity(userId);
          const quizActivity = recentActivity.filter(act => act.type === 'quiz');
          if (quizActivity.length > 0) {
            console.log('Quiz activity found in recent activity, but not in quiz results. Possible data inconsistency.');

            // Log quiz activity details to help debug
            console.log('Quiz activity details:', quizActivity);

            // Get user info for debugging
            const user = await storage.getUser(userId);
            console.log(`User info: ID=${userId}, Username=${user?.username}`);

            // Try to re-fetch quiz results directly
            try {
              const dbResults = await db.select()
                .from(quizResults)
                .where(eq(quizResults.userId, userId))
                .orderBy(desc(quizResults.createdAt));

              console.log(`Direct DB query found ${dbResults.length} quiz results`);
              if (dbResults.length > 0) {
                console.log('Sample result:', dbResults[0]);
              }
            } catch (dbErr) {
              console.error('Error directly querying quiz results:', dbErr);
            }
          }
        } catch (error) {
          console.error('Error checking recent activity:', error);
        }
      }

      // Count all unique quizzes attempted (by quiz ID)
      const uniqueQuizAttempts = new Set(quizResultsData.map(result => result.quizId));
      const quizzesAttempted = uniqueQuizAttempts.size;

      // Count passed quizzes (removing duplicates - only count each passed quiz once)
      const passedQuizIds = new Set(
        quizResultsData
          .filter(result => result.passed)
          .map(result => result.quizId)
      );
      const quizzesPassed = passedQuizIds.size;

      console.log(`Quizzes attempted: ${quizzesAttempted}, Quizzes passed: ${quizzesPassed}`);

      // For each course, get the user's progress
      const progress = await Promise.all(
        courses.map(async (course) => {
          const userProgress = await storage.getUserProgress(userId, course.id);

          // Count quiz results for this specific course
          const courseQuizResults = quizResultsData.filter(
            result => result.courseId === course.id
          );

          // Count unique quiz attempts for this course
          const courseQuizAttempts = new Set(
            courseQuizResults.map(result => result.quizId)
          ).size;

          // Count unique passed quizzes for this course
          const courseQuizzesPassed = new Set(
            courseQuizResults
              .filter(result => result.passed)
              .map(result => result.quizId)
          ).size;

          return {
            courseId: course.id,
            courseTitle: course.title,
            courseDescription: course.description,
            courseImage: course.imageUrl,
            progress: userProgress?.progress || 0,
            completedLessons: userProgress?.completedLessons || 0,
            quizzesPassed: courseQuizzesPassed, // Use actual count from quiz results
            courseQuizAttempts: courseQuizAttempts, // Add attempt count
            lastAccessed: userProgress?.lastAccessed || null
          };
        })
      );

      // Get user's mood entries for the dashboard
      const moodEntries = await storage.getUserMoodEntries(userId);

      // Get user's recent activity
      const recentActivity = await storage.getUserRecentActivity(userId);

      // Calculate overall stats from real data
      const totalLessons = progress.reduce((sum: number, course: ProgressItem) => sum + (course.completedLessons || 0), 0);

      // Calculate average quiz score - only count the highest score for each quiz
      let averageScore = 0;
      if (quizResultsData.length > 0) {
        // Group by quiz ID and get the highest score for each quiz
        const quizHighScores = new Map<number, number>();
        for (const result of quizResultsData) {
          const currentHighScore = quizHighScores.get(result.quizId) || 0;
          if (result.score > currentHighScore) {
            quizHighScores.set(result.quizId, result.score);
          }
        }

        // Calculate average of high scores
        const totalScore = Array.from(quizHighScores.values()).reduce((sum, score) => sum + score, 0);
        averageScore = Math.round(totalScore / quizHighScores.size);
      }

      // Update streak
      const streak = user?.streak || 0;

      // Format quiz results for display
      const formattedQuizResults = await Promise.all(
        quizResultsData.map(async (result) => {
          const quiz = await storage.getQuiz(result.quizId);
          return {
            id: result.id,
            quizId: result.quizId,
            title: quiz?.title || "Unknown Quiz",
            score: result.score,
            passed: result.passed,
            timestamp: result.createdAt,
            totalQuestions: quiz ? JSON.parse(quiz.questions).length : 0
          };
        })
      );

      res.json({
        progress,
        stats: {
          totalLessons,
          completedQuizzes: quizzesPassed,
          overallProgress: Math.round(progress.reduce((sum, course) => sum + course.progress, 0) / (progress.length || 1)),
          courseCount: progress.length,
          activeCourses: progress.filter(course => course.progress > 0).length,
          quizzesPassed: quizzesPassed,
          quizzesAttempted: quizzesAttempted,
          averageScore: `${averageScore}%`,
          totalQuizzes: courses.reduce((count, course) => {
            // Count quizzes associated with each course
            return count + 1; // Simplified - assuming 1 quiz per course for now
          }, 0),
          streak: streak
        },
        recentActivity: recentActivity.slice(0, 10),
        moodEntries: moodEntries.slice(0, 10),
        quizResults: formattedQuizResults
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Add this endpoint to track user activity time
  apiRouter.post("/api/user/track-activity", isAuthenticated, async (req, res) => {
    try {
      const activitySchema = z.object({
        duration: z.number().min(1), // Duration in seconds
        activityType: z.enum(["study", "mental"]).optional()
      });

      const activityData = activitySchema.parse(req.body);
      const userId = (req.user as Express.User).id;

      // Add activity to recent activity log
      const activity = {
        userId,
        type: 'timeSpent',
        message: `Spent ${Math.round(activityData.duration / 60)} minutes on ${activityData.activityType || 'platform'}`,
        // Convert string to Date for the trackUserActivity method
        timestamp: new Date(),
        relatedId: 0,
        duration: activityData.duration,
        activityType: activityData.activityType || 'study'
      };

      // Add to activity tracking in storage
      await storage.trackUserActivity({
        ...activity,
        // Convert string to Date for the trackUserActivity method
        timestamp: new Date()
      });

      // Update streak when user is active for more than 5 seconds (changed from 10)
      if (activityData.duration >= 5) {
        console.log(`User ${userId} has been active for ${activityData.duration} seconds, updating streak`);
        const streak = await storage.updateUserStreak(userId);
        console.log(`Updated streak for user ${userId} to ${streak}`);

        res.json({
          success: true,
          message: "Activity tracked successfully",
          streak
        });
      } else {
        console.log(`User ${userId} has been active for ${activityData.duration} seconds, not enough to update streak`);
        res.json({
          success: true,
          message: "Activity tracked successfully"
        });
      }
    } catch (error) {
      console.error("Error tracking user activity:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to track user activity" });
    }
  });

  // Record user activity
  apiRouter.post('/activity', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const activityData = req.body;

      // Basic validation
      if (!activityData || !activityData.type || !activityData.duration) {
        return res.status(400).json({ success: false, message: 'Invalid activity data' });
      }

      // Store the activity
      await storage.trackUserActivity({
        userId,
        type: activityData.type,
        message: activityData.message || `${activityData.type} activity`,
        // Convert string to Date for the trackUserActivity method
        timestamp: new Date(),
        relatedId: activityData.relatedId || 0,
        duration: activityData.duration,
        activityType: activityData.activityType || 'study'
      });

      res.json({ success: true, message: 'Activity recorded' });
    } catch (err) {
      console.error('Error recording activity:', err);
      res.status(500).json({ success: false, message: 'Failed to record activity' });
    }
  });

  // Debug endpoint to manually update streak
  apiRouter.post("/api/debug/update-streak", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;

      console.log(`Manually updating streak for user ${userId}`);

      // Schema for the request body
      const schema = z.object({
        increment: z.boolean().optional().default(true),
        streak: z.number().optional(),
        force: z.boolean().optional().default(false)
      });

      // Parse and validate the request body
      const { increment, streak, force } = schema.parse(req.body);

      let newStreak = 0;

      if (streak !== undefined) {
        // Direct update of streak to a specific value
        // First get the current user to avoid race conditions
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found"
          });
        }

        try {
          console.log(`Setting streak to ${streak} for user ${userId} (force=${force})`);

          // Directly update the user object with the new streak value
          // This is the most reliable way to update the streak
          await db.update(users).set({
            streak: streak,
            lastStreak: new Date().toISOString()
          }).where(eq(users.id, userId));

          console.log(`Successfully updated streak for user ${userId} to ${streak} in database`);

          // Set the new streak value for the response
          newStreak = streak;

          // Also update the user object in memory
          user.streak = streak;
          user.lastStreak = new Date().toISOString();
        } catch (error) {
          console.error("Error updating user streak:", error);

          // Try a fallback approach if the database update fails
          try {
            console.log("Trying fallback approach to update streak");

            // Modify user.streak directly
            user.streak = streak;
            user.lastStreak = new Date().toISOString();

            // Now call updateUserStreak to save the changes
            newStreak = await storage.updateUserStreak(userId);
            console.log(`Fallback approach succeeded, streak updated to ${newStreak}`);
          } catch (fallbackError) {
            console.error("Fallback approach also failed:", fallbackError);
            return res.status(500).json({
              success: false,
              message: "Error updating streak",
              error: String(error),
              fallbackError: String(fallbackError)
            });
          }
        }
      } else {
        // Get the current user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found"
          });
        }

        // For increment mode, force the streak to increment by 1
        if (increment) {
          const currentStreak = user.streak || 0;
          const newStreakValue = currentStreak + 1;

          console.log(`Force incrementing streak for user ${userId} from ${currentStreak} to ${newStreakValue}`);

          try {
            // Directly update the database for the most reliable approach
            await db.update(users).set({
              streak: newStreakValue,
              lastStreak: new Date().toISOString()
            }).where(eq(users.id, userId));

            console.log(`Successfully incremented streak for user ${userId} to ${newStreakValue} in database`);

            // Set the new streak value for the response
            newStreak = newStreakValue;

            // Also update the user object in memory
            user.streak = newStreakValue;
            user.lastStreak = new Date().toISOString();
          } catch (error) {
            console.error("Error incrementing streak in database:", error);

            // Try fallback approach
            try {
              console.log("Trying fallback approach to increment streak");

              // Set the streak to current + 1
              user.streak = newStreakValue;
              user.lastStreak = new Date().toISOString();

              // Call updateUserStreak to save the changes
              newStreak = await storage.updateUserStreak(userId);
              console.log(`Fallback approach succeeded, streak updated to ${newStreak}`);
            } catch (fallbackError) {
              console.error("Fallback approach also failed:", fallbackError);
              return res.status(500).json({
                success: false,
                message: "Error incrementing streak",
                error: String(error),
                fallbackError: String(fallbackError)
              });
            }
          }
        } else {
          // Standard update via the normal mechanism
          newStreak = await storage.updateUserStreak(userId);
        }

        console.log(`Updated streak for user ${userId} to ${newStreak}`);
      }

      // Also update all course progress to ensure everything is updated
      await storage.recalculateAllProgress(userId);

      // Return the new streak value in the response
      res.json({
        success: true,
        message: `Streak ${streak !== undefined ? 'set to' : 'updated to'} ${newStreak}`,
        streak: newStreak
      });
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update streak",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
