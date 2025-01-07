import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validateLoginData } from "../middleware/validation";

const router = Router();
const authController = new AuthController();

router.post("/login", validateLoginData, (req, res) =>
  authController.login(req, res)
);

export default router;
