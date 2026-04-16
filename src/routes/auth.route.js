import express from "express";
import { login, register } from "../controllers/auth.controlllers.js";
import * as authController from "../controllers/auth.controlllers.js";

const authRoute = express.Router();

authRoute.post("/login", login);
authRoute.post("/register", register);

// ส่วนของ OTP / Forgot Password
authRoute.post("/request-otp", authController.requestOTP);
authRoute.post("/verify-otp", authController.verifyOTP);
authRoute.post("/reset-password", authController.resetPassword);

export default authRoute;
