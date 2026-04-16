import { prisma } from "../config/prismaClient.js";
import jwt from "jsonwebtoken";
export const findUserByEmail = async (email) => {
  const user = await prisma.user.findFirst({
    where: { email: email },
  });
  return user;
};

export const createUser = async (dataObj) => {
    console.log('dataObj', dataObj)
  const newUser = await prisma.user.create({
    data: {
      firstName: dataObj.firstName,
      lastName: dataObj.lastName,
      username: dataObj.username,
      email: dataObj.email,
      password: dataObj.hashPassword,
      role: dataObj.role,
      street: dataObj.street,
      city: dataObj.city,
      postalCode: dataObj.postalCode,
    },
  });
  return newUser;
};

export const createToken = async (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1d",
  });
  return token;
};

export const findUserById = async (id) => {
  const user = await prisma.user.findFirst({
    where: { id: id },
  });
  return user;
};

export const editUser = async (email, username, hashPassword) => {
  const result = await prisma.user.update({
    where: { email: email },
    data: {
      username,
      password: hashPassword,
      role: user.role,
    },
  });
  return result;
};


// ในไฟล์ Service 

// 1. เก็บ OTP ลงใน User
export const updateOtp = async (email, otp, expires) => {
  return await prisma.user.update({
    where: { email: email },
    data: {
      resetOtp: otp,
      resetOtpExpires: expires,
    },
  });
};

// 2. ตรวจสอบ OTP ว่าตรงและไม่หมดอายุไหม
export const findUserByOtp = async (email, otp) => {
  return await prisma.user.findFirst({
    where: {
      email: email,
      resetOtp: otp,
      resetOtpExpires: {
        gt: new Date(), // ต้องมากกว่าเวลาปัจจุบัน (ยังไม่หมดอายุ)
      },
    },
  });
};

// 3. เคลียร์ OTP หลังจากเปลี่ยนรหัสผ่านเสร็จแล้ว
export const clearOtp = async (email, hashPassword) => {
  return await prisma.user.update({
    where: { email: email },
    data: {
      password: hashPassword,
      resetOtp: null,
      resetOtpExpires: null,
    },
  });
};