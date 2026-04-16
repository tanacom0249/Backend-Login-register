import createError from "http-errors";
import {
  createToken,
  createUser,
  findUserByEmail,
  updateOtp,
  findUserByOtp,
  clearOtp,
} from "../service/auth.service.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prismaClient.js";
import nodemailer from "nodemailer";

export async function register(req, res, next) {
  // 1. แกะค่าจาก body ตามโครงสร้างที่ Frontend ส่งมา
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    roles, // รับเป็น Array ตามที่ Frontend ส่ง
    address, // รับเป็น Object ตามที่ Frontend ส่ง
  } = req.body;

  // ดึงค่าข้างใน address ออกมา
  const { street, city, postalCode, suite } = address || {};

  try {
    await prisma.$connect();
    console.log("Connected to Database");

    // 2. Validation: ตรวจสอบข้อมูลให้ครบถ้วน
    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !password ||
      !street ||
      !city ||
      !postalCode ||
      !roles ||
      roles.length === 0
    ) {
      //  return เพื่อหยุดฟังก์ชันทันที
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const user = await findUserByEmail(email);
    if (user) {
      throw createError(400, "Email already exist");
    }

    const hashPassword = await bcrypt.hash(password, 5);

    // 3. สร้าง User ผ่าน Service
    const newUser = await createUser({
      firstName,
      lastName,
      username,
      email,
      hashPassword,
      role: roles[0],
      street,
      city,
      postalCode,
    });

    return res.status(201).json({
      message: "Register Success",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email,
        street: newUser.street,
        city: newUser.city,
        postalCode: newUser.postalCode,
      },
    });
  } catch (error) {
    next(error); // ส่งไปที่ Error Middleware
  }
}

export async function login(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) throw createError(401, "Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw createError(401, "Invalid credentials");

    const token = await createToken(user);
    return res.status(200).json({
      message: "Login Success",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
}

// เก็บฟังก์ชันการทำงาน เช่น requestOTP, verifyOTP, resetPassword

// ตั้งค่า Nodemailer (ใช้ค่าจาก .env)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password here, NOT your Gmail login password
  },
});

// --- 1. Request OTP ---
export async function requestOTP(req, res, next) {
  const { email } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) throw createError(404, "User not found with this email");

    // สุ่ม OTP 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60000); // หมดอายุใน 10 นาที

    // บันทึกลง Database ผ่าน Service
    await updateOtp(email, otp, expires);

    // ส่ง Email
    await transporter.sendMail({
      from: `"A Little Bid" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Password Reset",
      html: `<h2 style="color: #8B1A1A;">Verification Code: ${otp}</h2>
             <p>This code will expire in 10 minutes.</p>`,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    next(error);
  }
}

// --- 2. Verify OTP ---
export async function verifyOTP(req, res, next) {
  const { email, otp } = req.body;
  try {
    const user = await findUserByOtp(email, otp);
    if (!user) throw createError(400, "Invalid or expired OTP");

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
}

// --- 3. Reset Password ---
export async function resetPassword(req, res, next) {
  const { email, otp, newPassword } = req.body;
  try {
    // เช็คอีกครั้งว่า OTP ยังถูกต้อง (Security Check)
    const user = await findUserByOtp(email, otp);
    if (!user) throw createError(400, "Invalid session or OTP expired");

    // Hash รหัสผ่านใหม่
    const hashPassword = await bcrypt.hash(newPassword, 5);

    // อัปเดตรหัสใหม่และลบ OTP ออกผ่าน Service
    await clearOtp(email, hashPassword);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}
