import { Router } from "express";
import { body } from "express-validator";
import {
  createScheduleController,
  deleteScheduleController,
  getSchedules,
  toggleScheduleController,
  updateScheduleController,
} from "../controllers/scheduleController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const scheduleValidators = [
  body("time")
    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Time must be in HH:MM format"),
  body("daysOfWeek")
    .optional()
    .isArray({ min: 1 })
    .withMessage("daysOfWeek must be an array")
    .bail()
    .custom((days) => days.every((day) => day >= 0 && day <= 6))
    .withMessage("Day values must be between 0 and 6"),
  body("amount")
    .isInt({ min: 5, max: 1000 })
    .withMessage("Amount must be between 5 and 1000 grams"),
  body("name").optional().isString().trim().isLength({ min: 1, max: 50 }),
];

router.use(authMiddleware);

router.get("/get", getSchedules);
router.post("/create", scheduleValidators, createScheduleController);
router.put("/:id", scheduleValidators, updateScheduleController);
router.delete("/:id", deleteScheduleController);
router.patch(
  "/:id/toggle",
  [
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean if provided"),
  ],
  toggleScheduleController
);

export default router;

