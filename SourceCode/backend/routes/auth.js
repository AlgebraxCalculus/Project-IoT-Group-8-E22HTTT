import { Router } from "express";
import { body } from "express-validator";
import { login, register } from "../controllers/authController.js";

const router = Router();

const usernameValidator = body("username")
  .trim()
  .isLength({ min: 3 })
  .withMessage("Username must be at least 3 characters");

const passwordValidator = body("password")
  .isLength({ min: 1 })
  .withMessage("Password is required");

router.post("/register", [usernameValidator, passwordValidator], register);
router.post("/login", [usernameValidator, passwordValidator], login);

export default router;

