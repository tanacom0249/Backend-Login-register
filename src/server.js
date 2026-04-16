import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
