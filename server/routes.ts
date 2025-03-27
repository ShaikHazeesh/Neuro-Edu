import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertChatMessageSchema } from "@shared/schema";
import fetch from "node-fetch";
import { setupAuth } from "./auth";

// Authentication middleware for protected routes
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // prefix all routes with /api
  const apiRouter = app;

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

      // Add progress information if logged in
      // In a real app, this would check the session and add actual progress data
      // For now, we'll add mock progress to illustrate functionality
      const coursesWithProgress = courses.map(course => ({
        ...course,
        progress: Math.floor(Math.random() * 100) // Just for demonstration
      }));
      
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
      
      // Get progress data (mock for now)
      const progress = Math.floor(Math.random() * 100);

      res.json({
        ...course,
        modules,
        lessons,
        progress
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course details" });
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
  
  // Mark lesson as completed (protected)
  apiRouter.post("/api/lessons/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "Invalid lesson ID" });
      }
      
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      const userId = (req.user as Express.User).id;
      const userProgress = await storage.getUserProgress(userId, lesson.courseId);
      
      if (userProgress) {
        // Update existing progress
        const updatedProgress = {
          ...userProgress,
          lessonId,
          progress: Math.min(100, (userProgress.progress || 0) + 15), // Add 15% to progress for completing a lesson
          completedLessons: (userProgress.completedLessons || 0) + 1
        };
        
        await storage.updateUserProgress(updatedProgress);
      } else {
        // Create new progress entry
        await storage.updateUserProgress({
          userId,
          courseId: lesson.courseId,
          lessonId,
          progress: 15, // Start with 15% progress
          completedLessons: 1,
          quizzesPassed: 0
        });
      }
      
      res.json({ 
        success: true, 
        message: "Lesson marked as completed",
        progress: userProgress ? Math.min(100, (userProgress.progress || 0) + 15) : 15
      });
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
      res.status(500).json({ message: "Failed to update lesson progress" });
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
  
  // Submit quiz result (protected)
  apiRouter.post("/api/quizzes/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ message: "Invalid quiz ID" });
      }
      
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const resultSchema = z.object({
        score: z.number().min(0).max(100),
        answers: z.record(z.string(), z.union([z.string(), z.array(z.string())]))
      });
      
      const resultData = resultSchema.parse(req.body);
      const userId = (req.user as Express.User).id;
      
      // Update the user progress to track quiz completion
      const userProgress = await storage.getUserProgress(userId, quiz.courseId);
      
      // Check if the quiz was passed
      const isPassed = resultData.score >= (quiz.passingScore || 70);
      
      if (userProgress) {
        // Update existing progress
        const updatedProgress = {
          ...userProgress,
          progress: Math.min(100, (userProgress.progress || 0) + 10), // Add 10% to progress
          quizzesPassed: (userProgress.quizzesPassed || 0) + (isPassed ? 1 : 0),
          completedLessons: userProgress.completedLessons || 0
        };
        
        await storage.updateUserProgress(updatedProgress);
      } else {
        // Create new progress entry
        await storage.updateUserProgress({
          userId,
          courseId: quiz.courseId,
          progress: 10, // Start with 10% progress
          quizzesPassed: isPassed ? 1 : 0,
          completedLessons: 0
        });
      }
      
      // Return the processed results
      res.json({ 
        success: true, 
        passed: resultData.score >= (quiz.passingScore || 70),
        score: resultData.score,
        passingScore: quiz.passingScore || 70
      });
    } catch (error) {
      console.error("Error submitting quiz result:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to submit quiz result" });
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
      
      const newPost = await storage.createForumPost({
        ...postData,
        userId
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

  // AI Chat endpoint (updated for message history)
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
      
      // Check if Qroq API key is available
      const apiKey = process.env.QROQ_API_KEY;
      
      if (apiKey) {
        try {
          // Prepare the messages array with history and current message
          const messages = [
            ...history,
            { role: 'user', content: message }
          ];
          
          // Call to Qroq API
          const qroqResponse = await fetch('https://api.qroq.com/v1/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              messages,
              temperature: 0.7,
              max_tokens: 1000
            })
          });
          
          if (!qroqResponse.ok) {
            throw new Error(`Qroq API responded with status: ${qroqResponse.status}`);
          }
          
          const data = await qroqResponse.json() as {
            choices: Array<{
              message: {
                content: string;
              };
            }>;
          };
          
          if (data.choices && data.choices[0] && data.choices[0].message) {
            response = data.choices[0].message.content;
          } else {
            throw new Error("Unexpected response format from Qroq API");
          }
        } catch (error) {
          console.error("Error calling Qroq API:", error);
          response = "I'm having trouble connecting to my knowledge base at the moment. Please try again later.";
        }
      } else {
        // Provide a helpful response if API key is not available
        if (message.toLowerCase().includes("python")) {
          response = "Python is a high-level, interpreted programming language known for its readability and simplicity. It's great for beginners! Would you like me to help you with a specific Python concept?";
        } else if (message.toLowerCase().includes("javascript")) {
          response = "JavaScript is a versatile language used for web development. It allows you to create interactive elements on websites. What specific aspect of JavaScript are you interested in learning?";
        } else if (message.toLowerCase().includes("stress") || message.toLowerCase().includes("anxiety") || message.toLowerCase().includes("overwhelm")) {
          response = "It's normal to feel stressed when learning programming. Taking regular breaks, practicing mindfulness, and breaking tasks into smaller steps can help. Remember to be kind to yourself during this learning journey.";
        } else if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
          response = "Hello! I'm your AI assistant for both programming education and mental wellness. How can I help you today?";
        } else {
          response = "I'm here to help with your programming questions and provide mental health support. What specific topic would you like to learn about today?";
        }
      }

      // Save the chat message to storage
      await storage.saveChatMessage({
        userId,
        message,
        response,
        createdAt: new Date()
      });

      res.json({ response });
    } catch (error) {
      console.error("Error processing chat message:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Mood tracking endpoints (protected)
  apiRouter.post("/api/mood", isAuthenticated, async (req, res) => {
    try {
      const moodSchema = z.object({
        mood: z.enum(["Good", "Okay", "Struggling"]),
        journal: z.string().optional()
      });
      
      const moodData = moodSchema.parse(req.body);
      const userId = (req.user as Express.User).id;
      const savedEntry = await storage.saveMoodEntry({ ...moodData, userId });
      
      res.json(savedEntry);
    } catch (error) {
      console.error("Error saving mood entry:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to save mood entry" });
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
      const courses = await storage.getCourses();
      
      // For each course, get the user's progress
      const progress = await Promise.all(
        courses.map(async (course) => {
          const userProgress = await storage.getUserProgress(userId, course.id);
          return {
            courseId: course.id,
            courseTitle: course.title,
            courseDescription: course.description,
            courseImage: course.imageUrl,
            progress: userProgress?.progress || 0,
            completedLessons: userProgress?.completedLessons || 0,
            quizzesPassed: userProgress?.quizzesPassed || 0,
            lastAccessed: userProgress?.lastAccessed || null
          };
        })
      );
      
      // Get user's mood entries for the dashboard
      const moodEntries = await storage.getUserMoodEntries(userId);
      
      // Calculate overall stats
      const totalLessons = progress.reduce((sum, course) => sum + (course.completedLessons || 0), 0);
      const totalQuizzes = progress.reduce((sum, course) => sum + (course.quizzesPassed || 0), 0);
      const overallProgress = progress.length > 0 
        ? Math.round(progress.reduce((sum, course) => sum + course.progress, 0) / progress.length) 
        : 0;
        
      // Build recent activity log from both lessons and quizzes
      const recentActivity = [];
      
      // Add completed lessons to activity
      for (const course of progress) {
        if (course.completedLessons > 0) {
          recentActivity.push({
            type: 'lesson',
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            timestamp: course.lastAccessed,
            message: `Completed lesson in ${course.courseTitle}`
          });
        }
        
        if (course.quizzesPassed > 0) {
          recentActivity.push({
            type: 'quiz',
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            timestamp: course.lastAccessed,
            message: `Passed quiz in ${course.courseTitle}`
          });
        }
      }
      
      // Sort activity by timestamp
      recentActivity.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      res.json({
        progress,
        stats: {
          totalLessons,
          totalQuizzes,
          overallProgress,
          courseCount: progress.length,
          activeCourses: progress.filter(course => course.progress > 0).length
        },
        recentActivity: recentActivity.slice(0, 5), // Only send the 5 most recent activities
        moodEntries: moodEntries.slice(0, 10) // Only send the 10 most recent entries
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });
  
  apiRouter.get("/api/mood", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const entries = await storage.getUserMoodEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
