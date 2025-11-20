import { Schedule } from "../models/Schedule.js";

export const listSchedules = (userId) =>
  Schedule.find({ user: userId }).sort({ time: 1 }).lean();

export const createSchedule = (userId, payload) =>
  Schedule.create({
    user: userId,
    ...payload,
  });

export const updateSchedule = (userId, scheduleId, payload) =>
  Schedule.findOneAndUpdate(
    { _id: scheduleId, user: userId },
    { $set: payload },
    { new: true }
  );

export const deleteSchedule = (userId, scheduleId) =>
  Schedule.findOneAndDelete({ _id: scheduleId, user: userId });

export const toggleSchedule = async (userId, scheduleId, isActive) => {
  const schedule = await Schedule.findOne({ _id: scheduleId, user: userId });
  if (!schedule) {
    return null;
  }

  schedule.isActive =
    typeof isActive === "boolean" ? isActive : !schedule.isActive;
  await schedule.save();
  return schedule;
};

