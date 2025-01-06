// src/routes/profileRoutes.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import { ProfileController } from "../controllers/profileController";
import { validateProfileData } from "../middleware/validation";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const profileController = new ProfileController();

router.post(
  "/",
  upload.single("profilePicture"),
  validateProfileData,
  async (req: Request, res: Response) => {
    await profileController.createProfile(req, res);
  }
);

export default router;
