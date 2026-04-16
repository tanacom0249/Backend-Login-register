import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import cors from "cors";
import axios from "axios";
import express from "express";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use("/api/auth", authRoute);



// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
