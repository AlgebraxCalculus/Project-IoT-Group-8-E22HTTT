import { Schedule } from "../models/Schedule.js";
import { triggerScheduledFeed } from "./feedService.js";

/**
 * Check if current day matches schedule's daysOfWeek
 * @param {Array<Number>} daysOfWeek - Array of day numbers (0=Sunday, 6=Saturday)
 * @returns {Boolean}
 */
const isTodayInSchedule = (daysOfWeek) => {
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return false;
  }
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  return daysOfWeek.includes(today);
};

/**
 * Get current time string in HH:MM format (24-hour clock)
 * @returns {String}
 */
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Check if current time exactly matches schedule time (HH:MM)
 * @param {String} scheduleTime - Time in HH:MM format
 * @returns {Boolean}
 */
const isExactTimeMatch = (scheduleTime) => {
  if (!scheduleTime) {
    return false;
  }
  return scheduleTime === getCurrentTimeString();
};

/**
 * Process all active schedules and trigger feeds if conditions are met
 */
export const processScheduledFeeds = async () => {
  try {
    // Get all active schedules
    const activeSchedules = await Schedule.find({ isActive: true }).populate("user");
    
    if (activeSchedules.length === 0) {
      return;
    }

    console.log(`[Scheduler] Checking ${activeSchedules.length} active schedules at ${getCurrentTimeString()}...`);

    for (const schedule of activeSchedules) {
      try {
        // Check if today is in schedule's daysOfWeek
        if (!isTodayInSchedule(schedule.daysOfWeek)) {
          continue;
        }

        // Check if current time matches schedule time exactly
        if (!isExactTimeMatch(schedule.time)) {
          continue;
        }

        // Trigger feed
        console.log(`[Scheduler] Triggering scheduled feed for user ${schedule.user._id}`);
        await triggerScheduledFeed({
          userId: schedule.user._id,
          amount: schedule.amount,
          scheduleId: schedule._id,
        });
        
        console.log(`[Scheduler] Successfully triggered feed for schedule ${schedule._id}`);
      } catch (error) {
        console.error(`[Scheduler] Error processing schedule ${schedule._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in processScheduledFeeds:", error.message);
  }
};

