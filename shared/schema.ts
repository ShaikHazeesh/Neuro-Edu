import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  avatarUrl: true,
});

// Course model
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  level: text("level").notNull(), // Beginner, Intermediate, Advanced, All Levels
  category: text("category").notNull(), // Web Development, Python, JavaScript, etc.
  duration: text("duration").notNull(), // e.g. "8 weeks"
  lectureCount: integer("lecture_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  tags: text("tags").array(),
  duration: text("duration").notNull(), // e.g. "10:45"
  order: integer("order").notNull(),
  isFeatured: boolean("is_featured").default(false),
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  courseId: true,
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
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const insertModuleSchema = createInsertSchema(modules).pick({
  courseId: true,
  title: true,
  order: true,
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  lessonId: integer("lesson_id"),
  progress: integer("progress").default(0), // Percentage of completion
  lastAccessed: timestamp("last_accessed").defaultNow(),
  completed: boolean("completed").default(false),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  courseId: true,
  lessonId: true,
  progress: true,
  completed: true,
});

// Quiz model
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: json("questions").notNull(), // JSON array of quiz questions
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  lessonId: true,
  title: true,
  description: true,
  questions: true,
});

// Cheat sheet model
export const cheatSheets = pgTable("cheat_sheets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  level: text("level").notNull(), // Beginner, Intermediate, Advanced, All Levels
  topics: text("topics").array().notNull(),
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
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  likes: integer("likes").default(0),
  anonymous: boolean("anonymous").default(false),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).pick({
  userId: true,
  title: true,
  content: true,
  tags: true,
  anonymous: true,
});

// Forum comments
export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  likes: integer("likes").default(0),
  anonymous: boolean("anonymous").default(false),
});

export const insertForumCommentSchema = createInsertSchema(forumComments).pick({
  postId: true,
  userId: true,
  content: true,
  anonymous: true,
});

// Chat message history
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  response: true,
});

// Mood tracking
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mood: text("mood").notNull(), // Good, Okay, Struggling
  journal: text("journal"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).pick({
  userId: true,
  mood: true,
  journal: true,
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
