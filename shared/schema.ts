import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(String(new Date().toISOString())),
  streak: integer("streak").default(0),
  lastStreak: text("last_streak"),
});

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  courses: many(courses),
  forumPosts: many(forumPosts),
  forumComments: many(forumComments),
  chatMessages: many(chatMessages),
  moodEntries: many(moodEntries),
  completedLessons: many(completedLessons), // New relation for tracking completed lessons
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  createdAt: true,
  isAdmin: true,
});

// Course model
export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  level: text("level").notNull(), // Beginner, Intermediate, Advanced, All Levels
  category: text("category").notNull(), // Web Development, Python, JavaScript, etc.
  duration: text("duration").notNull(), // e.g. "8 weeks"
  lectureCount: integer("lecture_count").notNull(),
  createdAt: text("created_at").notNull().default(String(new Date().toISOString())),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  modules: many(modules),
  userProgress: many(userProgress),
}));

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  imageUrl: true,
  level: true,
  category: true,
  duration: true,
  lectureCount: true,
});

// Lesson model
export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull().references(() => courses.id),
  moduleId: integer("module_id").references(() => modules.id), // Reference to module
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  tags: text("tags"), // SQLite doesn't support arrays, store as JSON string
  duration: text("duration").notNull(), // e.g. "10:45"
  order: integer("order").notNull(),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  quizzes: many(quizzes),
  userProgress: many(userProgress),
  completedBy: many(completedLessons),
}));

export const insertLessonSchema = createInsertSchema(lessons).pick({
  courseId: true,
  moduleId: true,
  title: true,
  description: true,
  videoUrl: true,
  thumbnailUrl: true,
  tags: true,
  duration: true,
  order: true,
  isFeatured: true,
});

// Module model for organizing lessons
export const modules = sqliteTable("modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const insertModuleSchema = createInsertSchema(modules).pick({
  courseId: true,
  title: true,
  order: true,
});

// User progress tracking
export const userProgress = sqliteTable("user_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  progress: integer("progress").default(0), // Percentage of completion
  lastAccessed: text("last_accessed").notNull().default(String(new Date().toISOString())),
  completed: integer("completed", { mode: "boolean" }).default(false),
  quizzesPassed: integer("quizzes_passed").default(0),
  completedLessons: integer("completed_lessons").default(0),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userProgress.courseId],
    references: [courses.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  courseId: true,
  lessonId: true,
  progress: true,
  completed: true,
  quizzesPassed: true,
  completedLessons: true,
  lastAccessed: true,
});

// NEW: Completed lessons tracking table
export const completedLessons = sqliteTable("completed_lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  moduleId: integer("module_id").references(() => modules.id),
  completedAt: text("completed_at").notNull().default(String(new Date().toISOString())),
  watchProgress: integer("watch_progress").default(0), // Percentage of video watched
});

export const completedLessonsRelations = relations(completedLessons, ({ one }) => ({
  user: one(users, {
    fields: [completedLessons.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [completedLessons.lessonId],
    references: [lessons.id],
  }),
  course: one(courses, {
    fields: [completedLessons.courseId],
    references: [courses.id],
  }),
  module: one(modules, {
    fields: [completedLessons.moduleId],
    references: [modules.id],
  }),
}));

export const insertCompletedLessonSchema = createInsertSchema(completedLessons).pick({
  userId: true,
  lessonId: true,
  courseId: true,
  moduleId: true,
  completedAt: true,
  watchProgress: true,
});

// Quiz model
export const quizzes = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  questions: text("questions").notNull(), // JSON string in SQLite
  passingScore: integer("passing_score").default(70),
});

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
}));

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  lessonId: true,
  courseId: true,
  title: true,
  description: true,
  questions: true,
  passingScore: true,
});

// Cheat sheet model
export const cheatSheets = sqliteTable("cheat_sheets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  level: text("level").notNull(), // Beginner, Intermediate, Advanced, All Levels
  topics: text("topics"), // Store as JSON string
  downloadUrl: text("download_url").notNull(),
  color: text("color").notNull(), // primary, secondary, accent
});

export const insertCheatSheetSchema = createInsertSchema(cheatSheets).pick({
  title: true,
  level: true,
  topics: true,
  downloadUrl: true,
  color: true,
});

// Community forum posts
export const forumPosts = sqliteTable("forum_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags"), // Store as JSON string
  createdAt: text("created_at").notNull().default(String(new Date().toISOString())),
  updatedAt: text("updated_at").notNull().default(String(new Date().toISOString())),
  likes: integer("likes").default(0),
  anonymous: integer("anonymous", { mode: "boolean" }).default(false),
});

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [forumPosts.userId],
    references: [users.id],
  }),
  comments: many(forumComments),
}));

export const insertForumPostSchema = createInsertSchema(forumPosts).pick({
  userId: true,
  title: true,
  content: true,
  tags: true,
  anonymous: true,
});

// Forum comments
export const forumComments = sqliteTable("forum_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => forumPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(String(new Date().toISOString())),
  updatedAt: text("updated_at").notNull().default(String(new Date().toISOString())),
  likes: integer("likes").default(0),
  anonymous: integer("anonymous", { mode: "boolean" }).default(false),
});

export const forumCommentsRelations = relations(forumComments, ({ one }) => ({
  post: one(forumPosts, {
    fields: [forumComments.postId],
    references: [forumPosts.id],
  }),
  user: one(users, {
    fields: [forumComments.userId],
    references: [users.id],
  }),
}));

export const insertForumCommentSchema = createInsertSchema(forumComments).pick({
  postId: true,
  userId: true,
  content: true,
  anonymous: true,
});

// Chat message history
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: text("created_at").notNull().default(String(new Date().toISOString())),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  response: true,
  createdAt: true,
});

// Mood tracking
export const moodEntries = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(), // Good, Okay, Struggling
  journal: text("journal"),
  createdAt: text("created_at").notNull().default(String(new Date().toISOString())),
});

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
}));

export const insertMoodEntrySchema = createInsertSchema(moodEntries).pick({
  userId: true,
  mood: true,
  journal: true,
});

// Quiz results to track completed quizzes
export const quizResults = sqliteTable("quiz_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  score: integer("score").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  answers: text("answers"), // Store as JSON string
  timeTaken: integer("time_taken"), // Time taken in seconds
  createdAt: text("created_at").notNull().default(String(new Date().toISOString())),
});

export const quizResultsRelations = relations(quizResults, ({ one }) => ({
  user: one(users, {
    fields: [quizResults.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizResults.quizId],
    references: [quizzes.id],
  }),
  course: one(courses, {
    fields: [quizResults.courseId],
    references: [courses.id],
  }),
}));

export const insertQuizResultSchema = createInsertSchema(quizResults).pick({
  userId: true,
  quizId: true,
  courseId: true,
  score: true,
  passed: true,
  answers: true,
  timeTaken: true,
});

// User activity tracking
export const userActivity = sqliteTable("user_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'quiz', 'lesson', 'mood', 'breathing', 'timeSpent'
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull().default(String(new Date().toISOString())),
  relatedId: integer("related_id").default(0), // ID of related entity (quiz, lesson, etc.)
  duration: integer("duration"), // For timeSpent activities (in seconds)
  activityType: text("activity_type"), // 'study' or 'mental'
});

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

export const insertUserActivitySchema = createInsertSchema(userActivity).pick({
  userId: true,
  type: true,
  message: true,
  timestamp: true,
  relatedId: true,
  duration: true,
  activityType: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type CompletedLesson = typeof completedLessons.$inferSelect;
export type InsertCompletedLesson = z.infer<typeof insertCompletedLessonSchema>;

// Custom type that extends UserProgress to support Date objects
export interface UserProgressWithDate extends Omit<UserProgress, 'lastAccessed'> {
  lastAccessed: string | Date;
}

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type CheatSheet = typeof cheatSheets.$inferSelect;
export type InsertCheatSheet = z.infer<typeof insertCheatSheetSchema>;

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
