import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Express } from "express";

export const configureSecurityMiddleware = (app: Express) => {
  app.use(helmet());

  // Login rate limiter with skip options
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 attempts
    skipFailedRequests: true, // Don't count invalid requests
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later.",
      });
    },
    skip: (req) => {
      // Skip rate limiting for missing or invalid credentials
      const { email, passcode } = req.body;
      if (!email || !passcode) return true;
      if (typeof email !== "string" || typeof passcode !== "number")
        return true;
      return false;
    },
  });

  const profileLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 1 hour
    max: 3,
    skipFailedRequests: true, // Don't count invalid requests
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many profile creation attempts. Please try again later.",
      });
    },
  });

  return {
    loginLimiter,
    profileLimiter,
  };
};
