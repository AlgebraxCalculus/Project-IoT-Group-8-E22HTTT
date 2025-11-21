import dotenv from "dotenv";
import { defaultEnv } from "./defaultEnv.js";

dotenv.config();

Object.entries(defaultEnv).forEach(([key, value]) => {
  if (!process.env[key] && value) {
    process.env[key] = value;
  }
});

export const env = process.env;


