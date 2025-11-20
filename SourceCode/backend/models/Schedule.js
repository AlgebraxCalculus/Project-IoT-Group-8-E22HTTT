import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "Feeding schedule",
      trim: true,
    },
    time: {
      type: String,
      required: true,
      match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator: (days) => days.every((day) => day >= 0 && day <= 6),
        message: "Days of week must be between 0 (Sunday) and 6 (Saturday)",
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Schedule = mongoose.model("Schedule", scheduleSchema);

