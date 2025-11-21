import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const DEFAULT_USERNAME = process.env.DEFAULT_USERNAME || "operator";
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "operator123";

let cachedUser = null;

const ensureSingleUser = async () => {
  if (cachedUser) return cachedUser;

  let user = await User.findOne();
  if (!user) {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    user = await User.create({
      username: DEFAULT_USERNAME,
      password: hashedPassword,
      lastOnline: new Date(),
    });
  }

  cachedUser = user;
  return user;
};

export const authMiddleware = async (req, res, next) => {
  try {
    const user = await ensureSingleUser();
    req.user = user;
    next();
  } catch (error) {
    console.error("Single-user auth error:", error.message);
    res.status(500).json({ message: "Authentication system error" });
  }
};

