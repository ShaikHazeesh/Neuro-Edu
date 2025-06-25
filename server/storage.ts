import {
  users, User, InsertUser,
  courses, Course, InsertCourse,
  lessons, Lesson, InsertLesson,
  modules, Module, InsertModule,
  userProgress, UserProgress, InsertUserProgress,
  completedLessons, CompletedLesson, InsertCompletedLesson,
  quizzes, Quiz, InsertQuiz,
  cheatSheets, CheatSheet, InsertCheatSheet,
  forumPosts, ForumPost, InsertForumPost,
  forumComments, ForumComment, InsertForumComment,
  chatMessages, ChatMessage, InsertChatMessage,
  moodEntries, MoodEntry, InsertMoodEntry,
  quizResults, QuizResult, InsertQuizResult,
  userActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, asc, or, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
// Replace PostgreSQL session store with memory store
// const PostgresSessionStore = connectPg(session);

// Define our own Storage type instead of using built-in Storage
export type StorageProvider = IStorage;

export interface IStorage {
  // Session store for authentication
  sessionStore: any; // session.Store type

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByCategory(category: string): Promise<Course[]>;
  getCoursesByLevel(level: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Lesson operations
  getLessonsByCourseId(courseId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getFeaturedLesson(): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;

  // Module operations
  getModulesByCourseId(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;

  // User progress operations
  getUserProgress(userId: number, courseId: number): Promise<UserProgress | undefined>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // Completed lessons operations
  getCompletedLessons(userId: number, courseId: number): Promise<CompletedLesson[]>;
  getLessonCompletion(userId: number, lessonId: number): Promise<CompletedLesson | undefined>;
  markLessonCompleted(completedLesson: InsertCompletedLesson): Promise<CompletedLesson>;
  updateLessonWatchProgress(userId: number, lessonId: number, watchProgress: number): Promise<CompletedLesson | undefined>;
  isLessonUnlocked(userId: number, courseId: number, lessonId: number): Promise<boolean>;

  // Quiz operations
  getQuizzesByLessonId(lessonId: number): Promise<Quiz[]>;
  getQuizzesByCourseId(courseId: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;

  // Cheat sheet operations
  getCheatSheets(): Promise<CheatSheet[]>;
  getCheatSheet(id: number): Promise<CheatSheet | undefined>;
  createCheatSheet(cheatSheet: InsertCheatSheet): Promise<CheatSheet>;

  // Forum operations
  getForumPosts(): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getPostComments(postId: number): Promise<ForumComment[]>;
  createForumComment(comment: InsertForumComment): Promise<ForumComment>;

  // Chat operations
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getUserChatHistory(userId: number): Promise<ChatMessage[]>;

  // Mood tracking operations
  saveMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getUserMoodEntries(userId: number): Promise<MoodEntry[]>;

  // User streak operations
  updateUserStreak(userId: number): Promise<number>;

  // Quiz results operations
  saveQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getUserQuizResults(userId: number): Promise<QuizResult[]>;

  // Activity tracking operations
  trackUserActivity(activity: {
    userId: number;
    type: string;
    message: string;
    timestamp?: Date;
    relatedId?: number;
    duration?: number;
    activityType?: string;
  }): Promise<void>;
  getUserRecentActivity(userId: number): Promise<any[]>;

  // Helper methods for progress recalculation
  recalculateCourseProgress(userId: number, courseId: number): Promise<UserProgress | undefined>;
  recalculateAllProgress(userId: number): Promise<{ courseId: number, progress: number }[]>;

  /**
   * Tracks user activity
   */
  trackActivity(data: {
    userId: string;
    action: string;
    details: string;
    metadata?: string;
    duration?: number;
  }): Promise<void>;

  /**
   * Updates a user's streak and returns the new streak value
   */
  updateStreak(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private lessons: Map<number, Lesson>;
  private modules: Map<number, Module>;
  private userProgress: Map<string, UserProgress>; // key: userId-courseId
  private completedLessons: Map<string, CompletedLesson>; // key: userId-lessonId
  private quizzes: Map<number, Quiz>;
  private cheatSheets: Map<number, CheatSheet>;
  private forumPosts: Map<number, ForumPost>;
  private forumComments: Map<number, ForumComment>;
  private chatMessages: Map<number, ChatMessage>;
  private moodEntries: Map<number, MoodEntry>;
  private quizResults: Map<number, QuizResult>;
  private recentActivity: { userId: number; type: string; message: string; timestamp: string; relatedId: number }[];

  sessionStore: any;

  private userId: number = 1;
  private courseId: number = 1;
  private lessonId: number = 1;
  private moduleId: number = 1;
  private progressId: number = 1;
  private quizId: number = 1;
  private cheatSheetId: number = 1;
  private forumPostId: number = 1;
  private commentId: number = 1;
  private chatMessageId: number = 1;
  private moodEntryId: number = 1;
  private quizResultId: number = 1;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.modules = new Map();
    this.userProgress = new Map();
    this.completedLessons = new Map();
    this.quizzes = new Map();
    this.cheatSheets = new Map();
    this.forumPosts = new Map();
    this.forumComments = new Map();
    this.chatMessages = new Map();
    this.moodEntries = new Map();
    this.quizResults = new Map();
    this.recentActivity = [];

    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 1 day
    });

    // Initialize with some data
    this.initializeData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName || null,
      avatarUrl: insertUser.avatarUrl || null,
      createdAt: new Date().toISOString(),
      isAdmin: insertUser.isAdmin || false,
      streak: 0,
      lastStreak: null
    };
    this.users.set(id, user);
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      course => course.category === category
    );
  }

  async getCoursesByLevel(level: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      course => course.level === level
    );
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const course: Course = { ...insertCourse, id, createdAt: new Date().toISOString() };
    this.courses.set(id, course);
    return course;
  }

  // Lesson operations
  async getLessonsByCourseId(courseId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getFeaturedLesson(): Promise<Lesson | undefined> {
    return Array.from(this.lessons.values()).find(
      lesson => lesson.isFeatured
    );
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonId++;
    const lesson: Lesson = {
      id,
      title: insertLesson.title,
      description: insertLesson.description,
      duration: insertLesson.duration,
      courseId: insertLesson.courseId,
      moduleId: insertLesson.moduleId || null,
      order: insertLesson.order,
      videoUrl: insertLesson.videoUrl,
      thumbnailUrl: insertLesson.thumbnailUrl,
      tags: insertLesson.tags || null,
      isFeatured: insertLesson.isFeatured || null
    };
    this.lessons.set(id, lesson);
    return lesson;
  }

  // Module operations
  async getModulesByCourseId(courseId: number): Promise<Module[]> {
    return Array.from(this.modules.values())
      .filter(module => module.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = this.moduleId++;
    const module: Module = { ...insertModule, id };
    this.modules.set(id, module);
    return module;
  }

  // User progress operations
  async getUserProgress(userId: number, courseId: number): Promise<UserProgress | undefined> {
    return this.userProgress.get(`${userId}-${courseId}`);
  }

  // Helper function to calculate accurate progress based on completed lessons and quizzes
  async calculateCourseProgress(courseId: number, completedLessons: number, quizzesPassed: number): Promise<number> {
    // Get total number of lessons and quizzes for this course
    const allLessons = await this.getLessonsByCourseId(courseId);
    const allQuizzes = await this.getQuizzesByCourseId(courseId);
    const totalLessons = allLessons.length;
    const totalQuizzes = allQuizzes.length;

    console.log(`Calculating progress for course ${courseId}:
      - Completed Lessons: ${completedLessons}/${totalLessons}
      - Passed Quizzes: ${quizzesPassed}/${totalQuizzes}
    `);

    // If there are no lessons or quizzes, progress should be 0
    if (totalLessons === 0 && totalQuizzes === 0) {
      return 0;
    }

    // Calculate progress based on completed lessons and quizzes
    // Lessons are worth 70% of progress, quizzes are worth 30%
    const lessonWeight = 0.7;
    const quizWeight = 0.3;

    let lessonProgress = 0;
    let quizProgress = 0;

    if (totalLessons > 0) {
      lessonProgress = (completedLessons / totalLessons) * lessonWeight;
      console.log(`Lesson progress: ${completedLessons}/${totalLessons} = ${(lessonProgress/lessonWeight*100).toFixed(1)}%`);
    }

    if (totalQuizzes > 0) {
      quizProgress = (quizzesPassed / totalQuizzes) * quizWeight;
      console.log(`Quiz progress: ${quizzesPassed}/${totalQuizzes} = ${(quizProgress/quizWeight*100).toFixed(1)}%`);
    }

    // Calculate total progress and ensure it's between 0-100
    const calculatedProgress = Math.min(100, Math.max(0, Math.round((lessonProgress + quizProgress) * 100)));

    console.log(`Total calculated progress: ${calculatedProgress}%`);

    return calculatedProgress;
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const key = `${insertProgress.userId}-${insertProgress.courseId}`;
    const existingProgress = this.userProgress.get(key);

    // Determine the completed lessons and quizzes passed
    const completedLessons = insertProgress.completedLessons !== undefined
      ? insertProgress.completedLessons
      : (existingProgress?.completedLessons || 0);

    const quizzesPassed = insertProgress.quizzesPassed !== undefined
      ? insertProgress.quizzesPassed
      : (existingProgress?.quizzesPassed || 0);

    // Calculate the progress percentage based on completed lessons and quizzes
    // Only recalculate if not explicitly provided
    let progressValue = insertProgress.progress;
    if (progressValue === undefined || progressValue === null) {
      progressValue = await this.calculateCourseProgress(
        insertProgress.courseId,
        completedLessons || 0,
        quizzesPassed || 0
      );
    }

    // Ensure progress is 0 if no lessons or quizzes completed
    if (completedLessons === 0 && quizzesPassed === 0) {
      progressValue = 0;
    }

    let progress: UserProgress;
    if (existingProgress) {
      progress = {
        ...existingProgress,
        ...insertProgress,
        progress: progressValue,
        lastAccessed: new Date().toISOString(),
        quizzesPassed: quizzesPassed,
        completedLessons: completedLessons
      };
    } else {
      progress = {
        id: this.progressId++,
        userId: insertProgress.userId,
        courseId: insertProgress.courseId,
        lessonId: insertProgress.lessonId || null,
        progress: progressValue,
        completed: insertProgress.completed || null,
        lastAccessed: new Date().toISOString(),
        quizzesPassed: quizzesPassed,
        completedLessons: completedLessons
      };
    }

    console.log(`Updating progress for user ${insertProgress.userId}, course ${insertProgress.courseId}:`, {
      completedLessons,
      quizzesPassed,
      progress: progressValue
    });

    this.userProgress.set(key, progress);
    return progress;
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const key = `${progress.userId}-${progress.courseId}`;
    const existingProgress = this.userProgress.get(key);

    // Determine the completed lessons and quizzes passed
    const completedLessons = progress.completedLessons !== undefined
      ? progress.completedLessons
      : (existingProgress?.completedLessons || 0);

    const quizzesPassed = progress.quizzesPassed !== undefined
      ? progress.quizzesPassed
      : (existingProgress?.quizzesPassed || 0);

    // Calculate the progress percentage based on completed lessons and quizzes
    // Only recalculate if not explicitly provided
    let progressValue = progress.progress;
    if (progressValue === undefined || progressValue === null) {
      progressValue = await this.calculateCourseProgress(
        progress.courseId,
        completedLessons || 0,
        quizzesPassed || 0
      );
    }

    // Ensure progress is 0 if no lessons or quizzes completed
    if (completedLessons === 0 && quizzesPassed === 0) {
      progressValue = 0;
    }

    let newProgress: UserProgress;
    if (existingProgress) {
      newProgress = {
        ...existingProgress,
        ...progress,
        progress: progressValue,
        lastAccessed: new Date().toISOString(),
        quizzesPassed: quizzesPassed,
        completedLessons: completedLessons
      };
    } else {
      newProgress = {
        id: this.progressId++,
        userId: progress.userId,
        courseId: progress.courseId,
        lessonId: progress.lessonId || null,
        progress: progressValue,
        completed: progress.completed || null,
        lastAccessed: new Date().toISOString(),
        quizzesPassed: quizzesPassed,
        completedLessons: completedLessons
      };
    }

    console.log(`Creating progress for user ${progress.userId}, course ${progress.courseId}:`, {
      completedLessons,
      quizzesPassed,
      progress: progressValue
    });

    this.userProgress.set(key, newProgress);
    return newProgress;
  }

  // Completed lessons operations
  async getCompletedLessons(userId: number, courseId: number): Promise<CompletedLesson[]> {
    return Array.from(this.completedLessons.values())
      .filter(lesson => lesson.userId === userId && lesson.courseId === courseId);
  }

  async getLessonCompletion(userId: number, lessonId: number): Promise<CompletedLesson | undefined> {
    const key = `${userId}-${lessonId}`;
    return this.completedLessons.get(key);
  }

  async markLessonCompleted(completedLesson: InsertCompletedLesson): Promise<CompletedLesson> {
    const key = `${completedLesson.userId}-${completedLesson.lessonId}`;
    const existingCompletion = this.completedLessons.get(key);

    // Get the lesson to ensure we have the correct courseId
    const lesson = await this.getLesson(completedLesson.lessonId);
    if (!lesson) {
      throw new Error(`Lesson ${completedLesson.lessonId} not found`);
    }

    // Make sure we're using the correct courseId from the lesson
    const courseId = lesson.courseId;
    console.log(`Marking lesson ${completedLesson.lessonId} as completed for user ${completedLesson.userId} in course ${courseId}`);

    // If already completed, just return the existing record
    if (existingCompletion) {
      console.log(`Lesson ${completedLesson.lessonId} already completed by user ${completedLesson.userId}`);
      return existingCompletion;
    }

    // Create a new completion record
    const newCompletion: CompletedLesson = {
      id: this.progressId++, // Reuse the progress ID counter
      userId: completedLesson.userId,
      lessonId: completedLesson.lessonId,
      courseId: courseId, // Use the courseId from the lesson
      moduleId: lesson.moduleId || null,
      completedAt: new Date().toISOString(),
      watchProgress: completedLesson.watchProgress || 100 // Default to 100% if not specified
    };

    this.completedLessons.set(key, newCompletion);
    console.log(`Created new completion record for lesson ${completedLesson.lessonId} in course ${courseId}`);

    // Get all lessons for this course to calculate progress
    const courseLessons = await this.getLessonsByCourseId(courseId);
    const completedLessons = await this.getCompletedLessons(completedLesson.userId, courseId);

    // Calculate progress percentage
    const progressPercentage = Math.round(((completedLessons.length + 1) / courseLessons.length) * 100);
    console.log(`Progress for user ${completedLesson.userId} in course ${courseId}: ${progressPercentage}% (${completedLessons.length + 1}/${courseLessons.length})`);

    // Update the overall course progress
    const userProgress = await this.getUserProgress(completedLesson.userId, courseId);
    if (userProgress) {
      await this.updateUserProgress({
        ...userProgress,
        completedLessons: completedLessons.length + 1,
        progress: progressPercentage
      });
    } else {
      await this.updateUserProgress({
        userId: completedLesson.userId,
        courseId: courseId,
        completedLessons: 1,
        quizzesPassed: 0,
        progress: progressPercentage
      });
    }

    return newCompletion;
  }

  async updateLessonWatchProgress(userId: number, lessonId: number, watchProgress: number): Promise<CompletedLesson | undefined> {
    const key = `${userId}-${lessonId}`;
    const existingCompletion = this.completedLessons.get(key);

    // Get the lesson to get courseId and moduleId
    const lesson = await this.getLesson(lessonId);
    if (!lesson) {
      console.error(`Lesson ${lessonId} not found for watch progress update`);
      return undefined;
    }

    const courseId = lesson.courseId;
    console.log(`Updating watch progress for user ${userId}, lesson ${lessonId} in course ${courseId} to ${watchProgress}%`);

    if (existingCompletion) {
      // Update the watch progress
      const updatedCompletion: CompletedLesson = {
        ...existingCompletion,
        watchProgress: Math.max(existingCompletion.watchProgress || 0, watchProgress),
        // Only update completedAt if this is a new completion (progress = 100%)
        completedAt: watchProgress >= 100 && !existingCompletion.completedAt ?
          new Date().toISOString() : existingCompletion.completedAt
      };
      this.completedLessons.set(key, updatedCompletion);
      console.log(`Updated existing watch progress record to ${updatedCompletion.watchProgress}%`);
      return updatedCompletion;
    } else {
      // Create a new record with the watch progress
      const newCompletion: CompletedLesson = {
        id: this.progressId++,
        userId,
        lessonId,
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        // Only set completedAt if progress is 100%
        completedAt: watchProgress >= 100 ? new Date().toISOString() : new Date(0).toISOString(), // Use epoch time as placeholder
        watchProgress
      };
      this.completedLessons.set(key, newCompletion);
      console.log(`Created new watch progress record with ${watchProgress}%`);

      // If this is a 100% completion, update the course progress
      if (watchProgress >= 100) {
        console.log(`Lesson ${lessonId} completed with 100% watch progress, updating course progress`);
        // Get all lessons for this course to calculate progress
        const courseLessons = await this.getLessonsByCourseId(courseId);
        const completedLessons = await this.getCompletedLessons(userId, courseId);

        // Calculate progress percentage
        const progressPercentage = Math.round((completedLessons.length / courseLessons.length) * 100);

        // Update the overall course progress
        const userProgress = await this.getUserProgress(userId, courseId);
        if (userProgress) {
          await this.updateUserProgress({
            ...userProgress,
            completedLessons: completedLessons.length,
            progress: progressPercentage
          });
        } else {
          await this.updateUserProgress({
            userId,
            courseId,
            completedLessons: 1,
            quizzesPassed: 0,
            progress: progressPercentage
          });
        }
      }

      return newCompletion;
    }
  }

  async isLessonUnlocked(userId: number, courseId: number, lessonId: number): Promise<boolean> {
    // Get the lesson to check its order
    const lesson = await this.getLesson(lessonId);
    if (!lesson) {
      console.error(`Lesson ${lessonId} not found when checking if unlocked`);
      return false;
    }

    console.log(`Checking if lesson ${lessonId} (order ${lesson.order}) is unlocked for user ${userId} in course ${courseId}`);

    // First lesson is always unlocked
    if (lesson.order === 1) {
      console.log(`Lesson ${lessonId} is the first lesson, so it's unlocked`);
      return true;
    }

    // Get all lessons for this course
    const courseLessons = await this.getLessonsByCourseId(courseId);

    // Find the previous lesson
    const previousLessons = courseLessons
      .filter(l => l.order < lesson.order)
      .sort((a, b) => b.order - a.order); // Sort in descending order

    if (previousLessons.length === 0) {
      console.log(`No previous lessons found for lesson ${lessonId}, so it's unlocked`);
      return true; // No previous lessons, so this one is unlocked
    }

    const previousLesson = previousLessons[0];
    console.log(`Previous lesson for ${lessonId} is lesson ${previousLesson.id} (order ${previousLesson.order})`);

    // Check if the previous lesson is completed
    const previousLessonCompletion = await this.getLessonCompletion(userId, previousLesson.id);
    const watchProgress = previousLessonCompletion?.watchProgress || 0;
    const isUnlocked = !!previousLessonCompletion && watchProgress >= 80;

    console.log(`Previous lesson ${previousLesson.id} completion status: ${!!previousLessonCompletion ?
      `Completed with ${watchProgress}% progress` : 'Not completed'}`);
    console.log(`Lesson ${lessonId} is ${isUnlocked ? 'unlocked' : 'locked'}`);

    return isUnlocked;
  }

  // Quiz operations
  async getQuizzesByLessonId(lessonId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      quiz => quiz.lessonId === lessonId
    );
  }

  async getQuizzesByCourseId(courseId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      quiz => quiz.courseId === courseId
    );
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizId++;
    const quiz: Quiz = {
      id,
      title: insertQuiz.title,
      description: insertQuiz.description || null,
      courseId: insertQuiz.courseId,
      lessonId: insertQuiz.lessonId,
      questions: insertQuiz.questions,
      passingScore: insertQuiz.passingScore || null
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  // Cheat sheet operations
  async getCheatSheets(): Promise<CheatSheet[]> {
    return Array.from(this.cheatSheets.values());
  }

  async getCheatSheet(id: number): Promise<CheatSheet | undefined> {
    return this.cheatSheets.get(id);
  }

  async createCheatSheet(insertCheatSheet: InsertCheatSheet): Promise<CheatSheet> {
    const id = this.cheatSheetId++;
    const cheatSheet: CheatSheet = {
      ...insertCheatSheet,
      id,
      topics: insertCheatSheet.topics || null
    };
    this.cheatSheets.set(id, cheatSheet);
    return cheatSheet;
  }

  // Forum operations
  async getForumPosts(): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values())
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }

  async createForumPost(insertPost: InsertForumPost): Promise<ForumPost> {
    const now = new Date().toISOString();
    await db
      .insert(forumPosts)
      .values({
        ...insertPost,
        createdAt: now,
        updatedAt: now,
      likes: 0
      });

    // Get the last inserted post
    const [newPost] = await db
      .select()
      .from(forumPosts)
      .orderBy(desc(forumPosts.id))
      .limit(1);

    return newPost;
  }

  async getPostComments(postId: number): Promise<ForumComment[]> {
    return Array.from(this.forumComments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createForumComment(insertComment: InsertForumComment): Promise<ForumComment> {
    const now = new Date();
    const [newComment] = await db
      .insert(forumComments)
      .values({
        ...insertComment,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      likes: 0
      })
      .returning();
    return newComment;
  }

  // Chat operations
  async saveChatMessage(inputMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const chatMessage: ChatMessage = {
      id,
      userId: inputMessage.userId,
      message: inputMessage.message,
      response: inputMessage.response,
      createdAt: new Date().toISOString()
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }

  async getUserChatHistory(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  // Mood tracking operations
  async saveMoodEntry(inputEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.moodEntryId++;
    const moodEntry: MoodEntry = {
      id,
      userId: inputEntry.userId,
      mood: inputEntry.mood,
      journal: inputEntry.journal || null,
      createdAt: new Date().toISOString()
    };
    this.moodEntries.set(id, moodEntry);
    return moodEntry;
  }

  async getUserMoodEntries(userId: number): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  // Initialize with sample data
  private initializeData() {
    // Add initial data for demonstration
    // Courses
    const pythonCourse: Course = {
      id: this.courseId++,
      title: "Python Fundamentals",
      description: "Learn Python basics with mental health breaks built into the curriculum.",
      imageUrl: "https://res.cloudinary.com/dwaz8vzgx/image/upload/v1745836467/nwct9tamiwdid9lxdx6n.png",
      level: "Beginner",
      category: "Python",
      duration: "8 weeks",
      lectureCount: 24,
      createdAt: new Date().toISOString()
    };
    this.courses.set(pythonCourse.id, pythonCourse);

    const jsCourse: Course = {
      id: this.courseId++,
      title: "JavaScript Essentials",
      description: "Master JavaScript with a focus on short, manageable learning sessions.",
      imageUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      level: "Intermediate",
      category: "JavaScript",
      duration: "10 weeks",
      lectureCount: 32,
      createdAt: new Date().toISOString()
    };
    this.courses.set(jsCourse.id, jsCourse);

    const webDevCourse: Course = {
      id: this.courseId++,
      title: "Responsive Web Design",
      description: "Create beautiful websites with HTML/CSS while learning at your own pace.",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      level: "All Levels",
      category: "Web Development",
      duration: "6 weeks",
      lectureCount: 18,
      createdAt: new Date().toISOString()
    };
    this.courses.set(webDevCourse.id, webDevCourse);

    // Featured lesson
    const dataStructuresLesson: Lesson = {
      id: this.lessonId++,
      courseId: pythonCourse.id,
      moduleId: null, // No module assigned
      title: "Introduction to Data Structures",
      description: "Learn the fundamentals of data structures and how they can be implemented in Python.",
      videoUrl: "https://youtu.be/NClmyC6olC0?si=UFT-wjVpJ7Q2Sa9h",
      thumbnailUrl: "https://images.unsplash.com/photo-1550439062-609e1531270e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      tags: JSON.stringify(["Data Structures", "Python", "Algorithms"]),
      duration: "14:20",
      order: 1,
      isFeatured: true
    };
    this.lessons.set(dataStructuresLesson.id, dataStructuresLesson);

    // Modules for the featured lesson
    const modules = [
      {
        id: this.moduleId++,
        courseId: pythonCourse.id,
        title: "Introduction",
        order: 1
      },
      {
        id: this.moduleId++,
        courseId: pythonCourse.id,
        title: "Arrays & Lists",
        order: 2
      },
      {
        id: this.moduleId++,
        courseId: pythonCourse.id,
        title: "Linked Lists",
        order: 3
      },
      {
        id: this.moduleId++,
        courseId: pythonCourse.id,
        title: "Stacks & Queues",
        order: 4
      },
      {
        id: this.moduleId++,
        courseId: pythonCourse.id,
        title: "Hash Tables",
        order: 5
      },
      {
        id: this.moduleId++,
        courseId: pythonCourse.id,
        title: "Trees & Graphs",
        order: 6
      }
    ] as Module[];

    for (const module of modules) {
      this.modules.set(module.id, module);
    }

    // Cheat sheets
    const cheatSheets = [
      {
        id: this.cheatSheetId++,
        title: "Python Basics",
        level: "Beginner",
        topics: JSON.stringify(["Variables & Data Types", "Control Flow (if/else)", "Loops (for, while)", "Functions & Parameters", "Lists & Dictionaries"]),
        downloadUrl: "/cheat-sheets/python-basics.pdf",
        color: "primary"
      },
      {
        id: this.cheatSheetId++,
        title: "JavaScript Essentials",
        level: "Intermediate",
        topics: JSON.stringify(["ES6 Syntax", "Arrow Functions", "Promises & Async/Await", "Array Methods", "DOM Manipulation"]),
        downloadUrl: "/cheat-sheets/javascript-essentials.pdf",
        color: "secondary"
      },
      {
        id: this.cheatSheetId++,
        title: "CSS Grid & Flexbox",
        level: "All Levels",
        topics: JSON.stringify(["Flexbox Container Properties", "Flexbox Item Properties", "Grid Container Setup", "Grid Placement", "Responsive Layouts"]),
        downloadUrl: "/cheat-sheets/css-grid-flexbox.pdf",
        color: "accent"
      }
    ] as CheatSheet[];

    for (const cheatSheet of cheatSheets) {
      this.cheatSheets.set(cheatSheet.id, cheatSheet);
    }

    // Sample forum posts
    const forumPosts = [
      {
        id: this.forumPostId++,
        userId: 1,
        title: "How to overcome imposter syndrome as a beginner programmer?",
        content: "I've been learning to code for a few months now, but I still feel like I don't know enough. Any advice on dealing with imposter syndrome?",
        tags: JSON.stringify(["Mental Health", "Beginners", "Support"]),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 15,
        anonymous: false
      },
      {
        id: this.forumPostId++,
        userId: 2,
        title: "Strategies for maintaining focus during long coding sessions",
        content: "I find it hard to maintain focus when coding for long periods. What techniques do you use to stay focused and productive?",
        tags: JSON.stringify(["Focus", "Productivity", "Mental Health"]),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 23,
        anonymous: false
      },
      {
        id: this.forumPostId++,
        userId: 3,
        title: "Feeling overwhelmed by JavaScript frameworks",
        content: "There are so many JavaScript frameworks out there. How do you decide which one to learn without feeling overwhelmed?",
        tags: JSON.stringify(["JavaScript", "Frameworks", "Anxiety"]),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 19,
        anonymous: true
      }
    ] as ForumPost[];

    for (const post of forumPosts) {
      this.forumPosts.set(post.id, post);
    }
  }

  // Helper method to recalculate course progress
  async recalculateCourseProgress(userId: number, courseId: number): Promise<UserProgress | undefined> {
    console.log(`Recalculating progress for user ${userId} in course ${courseId}`);

    // Get all lessons for this course
    const courseLessons = await this.getLessonsByCourseId(courseId);
    if (courseLessons.length === 0) {
      console.log(`No lessons found for course ${courseId}`);
      return undefined;
    }

    // Get completed lessons for this user and course
    const completedLessons = await this.getCompletedLessons(userId, courseId);
    console.log(`Found ${completedLessons.length} completed lessons out of ${courseLessons.length} total lessons`);

    // Calculate progress percentage
    const progressPercentage = Math.round((completedLessons.length / courseLessons.length) * 100);

    // Get existing progress record or create a new one
    const existingProgress = await this.getUserProgress(userId, courseId);

    if (existingProgress) {
      // Update existing progress
      const updatedProgress: UserProgress = {
        ...existingProgress,
        completedLessons: completedLessons.length,
        progress: progressPercentage,
        lastAccessed: new Date().toISOString()
      };

      // Save the updated progress
      await this.updateUserProgress(updatedProgress);
      console.log(`Updated progress for user ${userId} in course ${courseId} to ${progressPercentage}%`);
      return updatedProgress;
    } else {
      // Create new progress record
      const newProgress: UserProgress = {
        id: this.progressId++,
        userId,
        courseId,
        lessonId: null,
        completedLessons: completedLessons.length,
        quizzesPassed: 0,
        progress: progressPercentage,
        completed: false,
        lastAccessed: new Date().toISOString()
      };

      // Save the new progress
      await this.updateUserProgress(newProgress);
      console.log(`Created new progress record for user ${userId} in course ${courseId} with ${progressPercentage}%`);
      return newProgress;
    }
  }

  // Helper method to recalculate all course progress for a user
  async recalculateAllProgress(userId: number): Promise<{ courseId: number, progress: number }[]> {
    console.log(`Recalculating all progress for user ${userId}`);

    // Get all courses
    const courses = await this.getCourses();
    const results: { courseId: number, progress: number }[] = [];

    // For each course, recalculate progress
    for (const course of courses) {
      const updatedProgress = await this.recalculateCourseProgress(userId, course.id);
      if (updatedProgress) {
        results.push({
          courseId: course.id,
          progress: updatedProgress.progress || 0
        });
      }
    }

    console.log(`Recalculated progress for ${results.length} courses`);
    return results;
  }

  async updateUserStreak(userId: number): Promise<number> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        console.error(`User ${userId} not found for streak update`);
        return 0;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Always start with at least 1 for the streak
      let newStreak = Math.max(1, user.streak || 0);

      console.log(`Current streak for user ${userId}: ${newStreak}`);
      console.log(`Last streak update: ${user.lastStreak || 'never'}`);

      // If there's a last streak date, check if it was yesterday or today
      if (user.lastStreak) {
        const lastStreakDate = new Date(user.lastStreak);
        const lastStreakDay = new Date(lastStreakDate.getFullYear(), lastStreakDate.getMonth(), lastStreakDate.getDate());

        // Calculate days between last streak and today
        const timeDiff = today.getTime() - lastStreakDay.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

        console.log(`Days since last streak for user ${userId}: ${daysDiff}`);

        if (daysDiff === 0) {
          // Already logged in today, don't increment streak but ensure it's at least 1
          console.log(`User ${userId} already had activity today, keeping streak at ${newStreak}`);

          // For debugging: Force increment streak if it's still at 0 despite activity
          if (newStreak === 0) {
            newStreak = 1;
            console.log(`Correcting streak from 0 to 1 for user ${userId}`);
          }
        } else if (daysDiff === 1) {
          // Consecutive day, increment streak
          newStreak += 1;
          console.log(`User ${userId} has a consecutive day, incrementing streak to ${newStreak}`);
        } else if (daysDiff > 1) {
          // More than one day gap, reset streak to 1
          newStreak = 1;
          console.log(`User ${userId} broke streak chain (${daysDiff} days), resetting to 1`);
        }
      } else {
        // First time user is active, set streak to 1
        newStreak = 1;
        console.log(`User ${userId} first activity, setting streak to 1`);
      }

      try {
        // Update user streak in database
        await db.update(users).set({
          streak: newStreak,
          lastStreak: now.toISOString()
        }).where(eq(users.id, userId));

        console.log(`Successfully updated streak for user ${userId} to ${newStreak} in database`);
      } catch (dbError) {
        console.error(`Failed to update streak in database: ${dbError}`);

        // Fallback to memory update if database fails
        const memUser = this.users.get(userId);
        if (memUser) {
          const updatedUser = {
            ...memUser,
            streak: newStreak,
            lastStreak: now.toISOString()
          };

          this.users.set(userId, updatedUser);
          console.log(`Updated streak for user ${userId} in memory: ${newStreak}`);
        }
      }

      return newStreak;
    } catch (error) {
      console.error(`Error in updateUserStreak: ${error}`);
      return 0;
    }
  }

  async saveQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    try {
      // Insert into database
      const [savedResult] = await db.insert(quizResults).values({
        userId: result.userId,
        quizId: result.quizId,
        courseId: result.courseId,
        score: result.score,
        passed: result.passed,
        answers: result.answers,
        timeTaken: result.timeTaken || null,
        createdAt: new Date().toISOString()
      }).returning();

      // Get the quiz title to use in the activity message
      const quiz = await this.getQuiz(result.quizId);
      const quizTitle = quiz?.title || "Quiz";

      // Add to recent activity
      await db.insert(userActivity).values({
        userId: result.userId,
        type: 'quiz',
        message: `Completed ${quizTitle} with score ${result.score}%${result.passed ? ' (Passed)' : ' (Failed)'}`,
        timestamp: new Date().toISOString(),
        relatedId: result.quizId,
        duration: result.timeTaken || 300, // Use time taken or default to 5 minutes
        activityType: 'study'
      });

      console.log(`Added quiz ${result.quizId} to recent activity for user ${result.userId}`);

      return {
        id: savedResult.id,
        userId: savedResult.userId,
        quizId: savedResult.quizId,
        courseId: savedResult.courseId,
        score: savedResult.score,
        passed: savedResult.passed,
        answers: savedResult.answers,
        timeTaken: savedResult.timeTaken,
        createdAt: new Date(savedResult.createdAt).toISOString()
      };
    } catch (error) {
      console.error("Database error when saving quiz result:", error);

      // Fallback to memory storage
      const id = this.quizResultId++;
      const quizResult: QuizResult = {
        id,
        userId: result.userId,
        quizId: result.quizId,
        courseId: result.courseId,
        score: result.score,
        passed: result.passed,
        answers: result.answers || null,
        timeTaken: result.timeTaken || null,
        createdAt: new Date().toISOString()
      };
      this.quizResults.set(id, quizResult);

      // Add to recent activity
      const quiz = this.quizzes.get(result.quizId);
      if (quiz) {
        this.recentActivity.push({
          userId: result.userId,
          type: 'quiz',
          message: `Completed ${quiz.title} with score ${result.score}%${result.passed ? ' (Passed)' : ' (Failed)'}`,
          timestamp: new Date().toISOString(),
          relatedId: result.quizId
        });
      }

      return quizResult;
    }
  }

  async getUserQuizResults(userId: number): Promise<QuizResult[]> {
    try {
      console.log(`Getting quiz results for user ${userId}`);

      // Try to get results from database first
      try {
        const results = await db.select()
          .from(quizResults)
          .where(eq(quizResults.userId, userId))
          .orderBy(desc(quizResults.createdAt));

        console.log(`Found ${results.length} quiz results in database for user ${userId}`);

        // Map database results to QuizResult objects
        return results.map((result: any) => ({
          id: result.id,
          userId: result.userId,
          quizId: result.quizId,
          courseId: result.courseId,
          score: result.score,
          passed: result.passed,
          answers: result.answers,
          timeTaken: result.timeTaken,
          createdAt: result.createdAt
        }));
      } catch (dbError) {
        console.error(`Error getting quiz results from database: ${dbError}`);
        // Fall back to memory storage
      }

      // Get results from memory if database failed
      const results = Array.from(this.quizResults.values()).filter(
        result => result.userId === userId
      );
      console.log(`Found ${results.length} quiz results in memory for user ${userId}`);

      // Sort by created date descending (most recent first)
      return results.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error(`Error in getUserQuizResults: ${error}`);
      return [];
    }
  }

  async trackUserActivity(activity: {
    userId: number;
    type: string;
    message: string;
    timestamp?: Date;
    relatedId?: number;
    duration?: number;
    activityType?: string;
  }): Promise<void> {
    try {
      // Insert activity into database
      await db.insert(userActivity).values({
        userId: activity.userId,
        type: activity.type,
        message: activity.message,
        timestamp: activity.timestamp ? activity.timestamp.toISOString() : new Date().toISOString(),
        relatedId: activity.relatedId || 0,
        duration: activity.duration,
        activityType: activity.activityType
      });

      console.log(`Activity tracked for user ${activity.userId}: ${activity.type}`);
    } catch (error) {
      console.error("Error tracking user activity in database:", error);

      // Fallback to memory storage
      this.recentActivity.push({
        userId: activity.userId,
        type: activity.type,
        message: activity.message,
        timestamp: activity.timestamp ? activity.timestamp.toISOString() : new Date().toISOString(),
        relatedId: activity.relatedId || 0
      });

      // If this is activity time tracking, log it
      if (activity.type === 'timeSpent' && activity.duration && activity.activityType) {
        console.log(`Tracked ${activity.duration}s of ${activity.activityType} activity for user ${activity.userId}`);
      }
    }
  }

  async getUserRecentActivity(userId: number): Promise<any[]> {
    try {
      const activities = await db
        .select()
        .from(userActivity)
        .where(eq(userActivity.userId, userId))
        .orderBy(desc(userActivity.timestamp))
        .limit(20);

      return activities;
    } catch (error) {
      console.error("Error fetching user recent activity from database:", error);
      return [];
    }
  }

  /**
   * Tracks user activity
   */
  async trackActivity(data: {
    userId: string;
    action: string;
    details: string;
    metadata?: string;
    duration?: number;
  }): Promise<void> {
    try {
      // Insert activity into database
      await db.insert(userActivity).values({
        userId: data.userId,
        type: data.action,
        message: data.details,
        timestamp: data.metadata ? new Date(data.metadata).toISOString() : new Date().toISOString(),
        relatedId: 0,
        duration: data.duration,
        activityType: 'user'
      });

      console.log(`Activity tracked for user ${data.userId}: ${data.action}`);
    } catch (error) {
      console.error("Error tracking user activity in database:", error);

      // Fallback to memory storage
      this.recentActivity.push({
        userId: parseInt(data.userId),
        type: data.action,
        message: data.details,
        timestamp: data.metadata ? new Date(data.metadata).toISOString() : new Date().toISOString(),
        relatedId: 0
      });

      // If this is activity time tracking, log it
      if (data.action === 'timeSpent' && data.duration && data.metadata) {
        console.log(`Tracked ${data.duration}s of ${data.metadata} activity for user ${data.userId}`);
      }
    }
  }

  /**
   * Updates a user's streak and returns the new streak value
   */
  async updateStreak(userId: string): Promise<number> {
    try {
      const user = await this.getUser(parseInt(userId));
      if (!user) {
        console.error(`User ${userId} not found for streak update`);
        return 0;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Always start with at least 1 for the streak
      let newStreak = Math.max(1, user.streak || 0);

      console.log(`Current streak for user ${userId}: ${newStreak}`);
      console.log(`Last streak update: ${user.lastStreak || 'never'}`);

      // If there's a last streak date, check if it was yesterday or today
      if (user.lastStreak) {
        const lastStreakDate = new Date(user.lastStreak);
        const lastStreakDay = new Date(lastStreakDate.getFullYear(), lastStreakDate.getMonth(), lastStreakDate.getDate());

        // Calculate days between last streak and today
        const timeDiff = today.getTime() - lastStreakDay.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

        console.log(`Days since last streak for user ${userId}: ${daysDiff}`);

        if (daysDiff === 0) {
          // Already logged in today, don't increment streak but ensure it's at least 1
          console.log(`User ${userId} already had activity today, keeping streak at ${newStreak}`);

          // For debugging: Force increment streak if it's still at 0 despite activity
          if (newStreak === 0) {
            newStreak = 1;
            console.log(`Correcting streak from 0 to 1 for user ${userId}`);
          }
        } else if (daysDiff === 1) {
          // Consecutive day, increment streak
          newStreak += 1;
          console.log(`User ${userId} has a consecutive day, incrementing streak to ${newStreak}`);
        } else if (daysDiff > 1) {
          // More than one day gap, reset streak to 1
          newStreak = 1;
          console.log(`User ${userId} broke streak chain (${daysDiff} days), resetting to 1`);
        }
      } else {
        // First time user is active, set streak to 1
        newStreak = 1;
        console.log(`User ${userId} first activity, setting streak to 1`);
      }

      try {
        // Update user streak in database
        await db.update(users).set({
          streak: newStreak,
          lastStreak: now.toISOString()
        }).where(eq(users.id, parseInt(userId)));

        console.log(`Successfully updated streak for user ${userId} to ${newStreak} in database`);
      } catch (dbError) {
        console.error(`Failed to update streak in database: ${dbError}`);

        // Fallback to memory update if database fails
        const memUser = this.users.get(parseInt(userId));
        if (memUser) {
          const updatedUser = {
            ...memUser,
            streak: newStreak,
            lastStreak: now.toISOString()
          };

          this.users.set(parseInt(userId), updatedUser);
          console.log(`Updated streak for user ${userId} in memory: ${newStreak}`);
        }
      }

      return newStreak;
    } catch (error) {
      console.error(`Error in updateStreak: ${error}`);
      return 0;
    }
  }
}

// Singleton pattern for MemStorage
let memoryStorageInstance: MemStorage | null = null;

function getMemoryStorage(): MemStorage {
  if (!memoryStorageInstance) {
    memoryStorageInstance = new MemStorage();
  }
  return memoryStorageInstance;
}

// Global storage instance
let storageInstance: StorageProvider | null = null;

// In the createStorage function, set the global instance
export function createStorage(): StorageProvider {
  if (!storageInstance) {
    try {
      // Just use the MemStorage for now until DatabaseStorage is implemented
      storageInstance = getMemoryStorage();
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      storageInstance = getMemoryStorage();
    }
  }
  return storageInstance;
}

// Create and export a singleton instance
export const storage = createStorage();
