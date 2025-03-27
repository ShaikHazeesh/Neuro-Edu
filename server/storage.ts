import {
  users, User, InsertUser,
  courses, Course, InsertCourse,
  lessons, Lesson, InsertLesson,
  modules, Module, InsertModule,
  userProgress, UserProgress, InsertUserProgress,
  quizzes, Quiz, InsertQuiz,
  cheatSheets, CheatSheet, InsertCheatSheet,
  forumPosts, ForumPost, InsertForumPost,
  forumComments, ForumComment, InsertForumComment,
  chatMessages, ChatMessage, InsertChatMessage,
  moodEntries, MoodEntry, InsertMoodEntry
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { sql } from "drizzle-orm/sql";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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
  
  // Quiz operations
  getQuizzesByLessonId(lessonId: number): Promise<Quiz[]>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private lessons: Map<number, Lesson>;
  private modules: Map<number, Module>;
  private userProgress: Map<string, UserProgress>; // key: userId-courseId
  private quizzes: Map<number, Quiz>;
  private cheatSheets: Map<number, CheatSheet>;
  private forumPosts: Map<number, ForumPost>;
  private forumComments: Map<number, ForumComment>;
  private chatMessages: Map<number, ChatMessage>;
  private moodEntries: Map<number, MoodEntry>;
  
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

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.modules = new Map();
    this.userProgress = new Map();
    this.quizzes = new Map();
    this.cheatSheets = new Map();
    this.forumPosts = new Map();
    this.forumComments = new Map();
    this.chatMessages = new Map();
    this.moodEntries = new Map();
    
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
      createdAt: new Date(),
      isAdmin: insertUser.isAdmin || false
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
    const course: Course = { ...insertCourse, id, createdAt: new Date() };
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
  
  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const key = `${insertProgress.userId}-${insertProgress.courseId}`;
    const existingProgress = this.userProgress.get(key);
    
    let progress: UserProgress;
    if (existingProgress) {
      progress = { 
        ...existingProgress, 
        ...insertProgress, 
        lastAccessed: new Date(),
        quizzesPassed: (insertProgress.quizzesPassed !== undefined) 
          ? insertProgress.quizzesPassed 
          : (existingProgress.quizzesPassed || 0),
        completedLessons: (insertProgress.completedLessons !== undefined) 
          ? insertProgress.completedLessons 
          : (existingProgress.completedLessons || 0)
      };
    } else {
      progress = { 
        id: this.progressId++, 
        userId: insertProgress.userId,
        courseId: insertProgress.courseId,
        lessonId: insertProgress.lessonId || null,
        progress: insertProgress.progress || null,
        completed: insertProgress.completed || null,
        lastAccessed: new Date(),
        quizzesPassed: insertProgress.quizzesPassed || 0,
        completedLessons: insertProgress.completedLessons || 0
      };
    }
    
    this.userProgress.set(key, progress);
    return progress;
  }
  
  // Quiz operations
  async getQuizzesByLessonId(lessonId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      quiz => quiz.lessonId === lessonId
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
    const cheatSheet: CheatSheet = { ...insertCheatSheet, id };
    this.cheatSheets.set(id, cheatSheet);
    return cheatSheet;
  }
  
  // Forum operations
  async getForumPosts(): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values())
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getForumPost(id: number): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }
  
  async createForumPost(insertPost: InsertForumPost): Promise<ForumPost> {
    const id = this.forumPostId++;
    const now = new Date();
    const post: ForumPost = { 
      id,
      userId: insertPost.userId,
      title: insertPost.title,
      content: insertPost.content,
      tags: insertPost.tags ?? null,
      anonymous: insertPost.anonymous ?? null,
      createdAt: now, 
      updatedAt: now, 
      likes: 0
    };
    this.forumPosts.set(id, post);
    return post;
  }
  
  async getPostComments(postId: number): Promise<ForumComment[]> {
    return Array.from(this.forumComments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
  
  async createForumComment(insertComment: InsertForumComment): Promise<ForumComment> {
    const id = this.commentId++;
    const now = new Date();
    const comment: ForumComment = {
      id,
      postId: insertComment.postId,
      userId: insertComment.userId,
      content: insertComment.content,
      anonymous: insertComment.anonymous ?? null,
      createdAt: now,
      updatedAt: now,
      likes: 0
    };
    this.forumComments.set(id, comment);
    return comment;
  }
  
  // Chat operations
  async saveChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const message: ChatMessage = {
      id,
      userId: insertMessage.userId,
      message: insertMessage.message,
      response: insertMessage.response,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }
  
  async getUserChatHistory(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
  
  // Mood tracking operations
  async saveMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.moodEntryId++;
    const entry: MoodEntry = {
      id,
      userId: insertEntry.userId,
      mood: insertEntry.mood,
      journal: insertEntry.journal || null,
      createdAt: new Date()
    };
    this.moodEntries.set(id, entry);
    return entry;
  }
  
  async getUserMoodEntries(userId: number): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
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
      imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      level: "Beginner",
      category: "Python",
      duration: "8 weeks",
      lectureCount: 24,
      createdAt: new Date()
    };
    this.courses.set(pythonCourse.id, pythonCourse);
    
    const jsCourse: Course = {
      id: this.courseId++,
      title: "JavaScript Essentials",
      description: "Master JavaScript with a focus on short, manageable learning sessions.",
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      level: "Intermediate",
      category: "JavaScript",
      duration: "10 weeks",
      lectureCount: 32,
      createdAt: new Date()
    };
    this.courses.set(jsCourse.id, jsCourse);
    
    const webDevCourse: Course = {
      id: this.courseId++,
      title: "Responsive Web Design",
      description: "Create beautiful websites with HTML/CSS while learning at your own pace.",
      imageUrl: "https://images.unsplash.com/photo-1603322327561-7c47f9236e5e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      level: "All Levels",
      category: "Web Development",
      duration: "6 weeks",
      lectureCount: 18,
      createdAt: new Date()
    };
    this.courses.set(webDevCourse.id, webDevCourse);
    
    // Featured lesson
    const dataStructuresLesson: Lesson = {
      id: this.lessonId++,
      courseId: pythonCourse.id,
      title: "Introduction to Data Structures",
      description: "Learn the fundamentals of data structures and how they can be implemented in Python.",
      videoUrl: "https://www.youtube.com/watch?v=_t2GVaQasRY",
      thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      tags: ["Data Structures", "Python", "Algorithms"],
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
        topics: ["Variables & Data Types", "Control Flow (if/else)", "Loops (for, while)", "Functions & Parameters", "Lists & Dictionaries"],
        downloadUrl: "/cheat-sheets/python-basics.pdf",
        color: "primary"
      },
      {
        id: this.cheatSheetId++,
        title: "JavaScript Essentials",
        level: "Intermediate",
        topics: ["ES6 Syntax", "Arrow Functions", "Promises & Async/Await", "Array Methods", "DOM Manipulation"],
        downloadUrl: "/cheat-sheets/javascript-essentials.pdf",
        color: "secondary"
      },
      {
        id: this.cheatSheetId++,
        title: "CSS Grid & Flexbox",
        level: "All Levels",
        topics: ["Flexbox Container Properties", "Flexbox Item Properties", "Grid Container Setup", "Grid Placement", "Responsive Layouts"],
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
        tags: ["Mental Health", "Beginners", "Support"],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        likes: 15,
        anonymous: false
      },
      {
        id: this.forumPostId++,
        userId: 2,
        title: "Strategies for maintaining focus during long coding sessions",
        content: "I find it hard to maintain focus when coding for long periods. What techniques do you use to stay focused and productive?",
        tags: ["Focus", "Productivity", "Mental Health"],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        likes: 23,
        anonymous: false
      },
      {
        id: this.forumPostId++,
        userId: 3,
        title: "Feeling overwhelmed by JavaScript frameworks",
        content: "There are so many JavaScript frameworks out there. How do you decide which one to learn without feeling overwhelmed?",
        tags: ["JavaScript", "Frameworks", "Anxiety"],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        likes: 19,
        anonymous: true
      }
    ] as ForumPost[];
    
    for (const post of forumPosts) {
      this.forumPosts.set(post.id, post);
    }
  }
}

export class DatabaseStorage implements IStorage {
  // Session store for authentication
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL
      },
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.category, category));
  }

  async getCoursesByLevel(level: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.level, level));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  // Lesson operations
  async getLessonsByCourseId(courseId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getFeaturedLesson(): Promise<Lesson | undefined> {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.isFeatured, true));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  // Module operations
  async getModulesByCourseId(courseId: number): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.order);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  // User progress operations
  async getUserProgress(userId: number, courseId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.courseId, courseId)
        )
      );
    return progress;
  }

  async updateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const { userId, courseId } = progress;
    const existingProgress = await this.getUserProgress(userId, courseId);
    
    if (existingProgress) {
      const [updated] = await db
        .update(userProgress)
        .set({ ...progress, lastAccessed: new Date() })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db
        .insert(userProgress)
        .values({ ...progress, lastAccessed: new Date() })
        .returning();
      return newProgress;
    }
  }

  // Quiz operations
  async getQuizzesByLessonId(lessonId: number): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  // Cheat sheet operations
  async getCheatSheets(): Promise<CheatSheet[]> {
    return await db.select().from(cheatSheets);
  }

  async getCheatSheet(id: number): Promise<CheatSheet | undefined> {
    const [cheatSheet] = await db.select().from(cheatSheets).where(eq(cheatSheets.id, id));
    return cheatSheet;
  }

  async createCheatSheet(cheatSheet: InsertCheatSheet): Promise<CheatSheet> {
    const [newCheatSheet] = await db.insert(cheatSheets).values(cheatSheet).returning();
    return newCheatSheet;
  }

  // Forum operations
  async getForumPosts(): Promise<ForumPost[]> {
    return await db
      .select()
      .from(forumPosts)
      .orderBy(desc(forumPosts.createdAt));
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const now = new Date();
    const [newPost] = await db
      .insert(forumPosts)
      .values({
        ...post,
        createdAt: now,
        updatedAt: now,
        likes: 0
      })
      .returning();
    return newPost;
  }

  async getPostComments(postId: number): Promise<ForumComment[]> {
    return await db
      .select()
      .from(forumComments)
      .where(eq(forumComments.postId, postId))
      .orderBy(forumComments.createdAt);
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const now = new Date();
    const [newComment] = await db
      .insert(forumComments)
      .values({
        ...comment,
        createdAt: now,
        updatedAt: now,
        likes: 0
      })
      .returning();
    return newComment;
  }

  // Chat operations
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        ...message,
        createdAt: new Date()
      })
      .returning();
    return newMessage;
  }

  async getUserChatHistory(userId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);
  }

  // Mood tracking operations
  async saveMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry> {
    const [newEntry] = await db
      .insert(moodEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getUserMoodEntries(userId: number): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt));
  }
}

// Initialize memory storage for the application (fallback when database is not working)
export const storage = new MemStorage();
