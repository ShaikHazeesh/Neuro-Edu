import express from "express";
import cors from "cors";
import session from "express-session";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { storage } from "./storage";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable JSON body parsing
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "mindspacedev123",
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

// Register API routes
async function startServer() {
  try {
    // Start the server with API routes only (no Vite integration)
    const server = await registerRoutes(app);
    
    // Only try to serve static files if we're in production mode
    if (process.env.NODE_ENV === 'production') {
      const clientBuildPath = path.join(__dirname, 'public');
      
      // Check if client build exists before trying to serve it
      try {
        if (require('fs').existsSync(clientBuildPath)) {
          app.use(express.static(clientBuildPath));
          app.get('*', (req, res) => {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
          });
        } else {
          console.log("Client build not found, running in API-only mode");
        }
      } catch (err) {
        console.log("Running in API-only mode");
      }
    } else {
      console.log("Running in API-only mode for development");
    }
    
    // this serves only the API endpoints for development
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0"
    }, () => {
      log(`API server running on http://localhost:${port}`);
      console.log(`API key status: ${process.env.GROQ_API_KEY ? "Available" : "Not available"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
