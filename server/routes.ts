import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertChatMessageSchema } from "@shared/schema";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Forum endpoints
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

  // AI Chat endpoint
  apiRouter.post("/api/chat", async (req, res) => {
    try {
      // Validate request body
      const messageSchema = z.object({
        message: z.string().min(1, "Message cannot be empty"),
        userId: z.number().optional()
      });
      
      const { message, userId = 1 } = messageSchema.parse(req.body);

      let response;
      
      // Check if Qroq API key is available
      const apiKey = process.env.QROQ_API_KEY || process.env.API_KEY;
      
      if (apiKey) {
        // Make call to Qroq API
        try {
          const qroqResponse = await fetch('https://api.qroq.com/v1/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: message }]
            })
          });
          
          if (!qroqResponse.ok) {
            throw new Error(`Qroq API responded with status: ${qroqResponse.status}`);
          }
          
          const data = await qroqResponse.json();
          response = data.choices[0].message.content;
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
        } else {
          response = "I'm here to help with your programming questions and provide mental health support. What specific topic would you like to learn about today?";
        }
      }

      // Save the chat message to storage
      await storage.saveChatMessage({
        userId,
        message,
        response
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

  // Mood tracking endpoints
  apiRouter.post("/api/mood", async (req, res) => {
    try {
      const moodSchema = z.object({
        userId: z.number().default(1),
        mood: z.enum(["Good", "Okay", "Struggling"]),
        journal: z.string().optional()
      });
      
      const moodData = moodSchema.parse(req.body);
      const savedEntry = await storage.saveMoodEntry(moodData);
      
      res.json(savedEntry);
    } catch (error) {
      console.error("Error saving mood entry:", error);
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to save mood entry" });
    }
  });

  apiRouter.get("/api/mood/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

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
