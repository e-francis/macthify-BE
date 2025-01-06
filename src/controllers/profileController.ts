import { Request, Response } from "express";
import { ProfileService } from "../services/profileService";
import { logger } from "../config/logger";

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      logger.info("Received profile creation request:", {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });

      const profileId = await this.profileService.createProfile(req.body);

      res.status(201).json({
        success: true,
        message: "Profile created successfully",
        profileId,
      });
    } catch (error: any) {
      logger.error("Profile creation error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
