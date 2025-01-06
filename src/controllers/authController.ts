// src/controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { logger } from "../config/logger";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      logger.info("Received login request for email:", req.body.email);

      const result = await this.authService.login(
        req.body.email,
        req.body.passcode
      );
      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Login error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
