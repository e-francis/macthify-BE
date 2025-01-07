import express from "express";
import dotenv from "dotenv";
import profileRoutes from "./routes/profileRoutes";
import authRoutes from "./routes/authRoutes";
import { logger } from "./config/logger";
import { configureSecurityMiddleware } from "./middleware/security";
import { db } from "./config/firebase";

console.log("Firebase initialized:", !!db);

dotenv.config();

const app = express();

// Security middleware configuration
const { loginLimiter, profileLimiter } = configureSecurityMiddleware(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this for form data

// Test route to verify API is working
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiters to specific routes
app.use("/v1/api/auth/login", loginLimiter);
app.use("/v1/api/create-profile", profileLimiter);

// Routes
app.use("/v1/api/create-profile", profileRoutes);
app.use("/v1/api/auth", authRoutes);

// Handle undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Start the server only in local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
    console.log(
      `Health check available at: http://localhost:${PORT}/api/health`
    );
    console.log(`API endpoints:`);
    console.log(`- POST http://localhost:${PORT}/v1/api/auth/login`);
    console.log(`- POST http://localhost:${PORT}/v1/api/create-profile`);
  });
}

export default app;
