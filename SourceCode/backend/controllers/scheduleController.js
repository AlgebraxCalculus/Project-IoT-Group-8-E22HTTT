import { validationResult } from "express-validator";
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  toggleSchedule,
  updateSchedule,
} from "../services/scheduleService.js";

export const getSchedules = async (req, res) => {
  try {
    const schedules = await listSchedules(req.user._id);
    return res.json({ schedules });
  } catch (error) {
    console.error("Get schedules error:", error.message);
    return res.status(500).json({ message: "Failed to fetch schedules" });
  }
};

export const createScheduleController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const schedule = await createSchedule(req.user._id, req.body);
    return res.status(201).json({ schedule });
  } catch (error) {
    console.error("Create schedule error:", error.message);
    return res.status(500).json({ message: "Failed to create schedule" });
  }
};

export const updateScheduleController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const schedule = await updateSchedule(req.user._id, req.params.id, req.body);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    return res.json({ schedule });
  } catch (error) {
    console.error("Update schedule error:", error.message);
    return res.status(500).json({ message: "Failed to update schedule" });
  }
};

export const deleteScheduleController = async (req, res) => {
  try {
    const schedule = await deleteSchedule(req.user._id, req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Delete schedule error:", error.message);
    return res.status(500).json({ message: "Failed to delete schedule" });
  }
};

export const toggleScheduleController = async (req, res) => {
  const { isActive } = req.body;

  try {
    const schedule = await toggleSchedule(req.user._id, req.params.id, isActive);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    return res.json({ schedule });
  } catch (error) {
    console.error("Toggle schedule error:", error.message);
    return res.status(500).json({ message: "Failed to toggle schedule" });
  }
};

