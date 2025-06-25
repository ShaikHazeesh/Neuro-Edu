import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "studybuddy-secret-key", // Should be set in environment variables
    resave: false,
    saveUninitialized: true, // Changed to true to ensure session is created
    store: storage.sessionStore,
    cookie: {
      secure: false, // Changed to false for development
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax'
    },
  };

  // Enable express-session
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    console.log("REGISTER ENDPOINT CALLED", req.body);
    try {
      const { username, password, email, fullName } = req.body;
      
      // Validate required fields
      if (!username || !password || !email) {
        console.log("REGISTER VALIDATION FAILED - missing fields");
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("REGISTER FAILED - username already exists");
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create the user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName: fullName || null,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        isAdmin: false
      });
      
      console.log("USER CREATED SUCCESSFULLY", { id: user.id, username: user.username });
      
      // Log the user in and send response
      req.login(user, (err) => {
        if (err) {
          console.log("LOGIN AFTER REGISTER FAILED", err);
          return next(err);
        }
        
        // Return user info without password
        const { password, ...userWithoutPassword } = user;
        console.log("REGISTER COMPLETED SUCCESSFULLY");
        
        // Set an explicit cookie header for session
        res.cookie('connect.sid', req.sessionID, { 
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      console.error("REGISTER ERROR", err);
      res.status(500).json({ message: "Registration failed due to a server error" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user info without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    try {
      // User data is available only if authenticated
      if (req.isAuthenticated()) {
        // Return user info without sensitive data
        const { password, ...userWithoutPassword } = req.user as Express.User;
        res.json(userWithoutPassword);
      } else {
        // Return null if not authenticated
        res.status(401).json({ 
          message: "Not authenticated", 
          isAuthenticated: false 
        });
      }
    } catch (error) {
      console.error("Error in /api/user endpoint:", error);
      res.status(500).json({ 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // User profile update
  app.patch("/api/user/profile", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const profileSchema = z.object({
        fullName: z.string().optional(),
        email: z.string().email("Please enter a valid email"),
        avatarUrl: z.string().optional()
      });
      
      const profileData = profileSchema.parse(req.body);
      const userId = (req.user as SelectUser).id;
      
      // For a real implementation, we would update the user in the database
      // For now, we'll just return the updated user data
      const updatedUser = {
        ...req.user,
        ...profileData
      };
      
      // Omit password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(err => ({ path: err.path.join('.'), message: err.message }))
        });
      }
      next(error);
    }
  });
}