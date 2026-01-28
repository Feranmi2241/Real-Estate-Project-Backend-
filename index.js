import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
// import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import listingRouter from "./routes/listing.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import transactionRouter from "./routes/transaction.route.js";
import transactionSaveRouter from "./routes/transactionSave.route.js";
import revenueRouter from "./routes/revenue.route.js";
import chatRouter from "./routes/chat.route.js";
import forgotPasswordRouter from "./routes/forgotPassword.route.js";
import adminAuthRouter from "./routes/adminAuth.route.js";
import userProfileRouter from "./routes/userProfile.route.js";
import authTestRouter from "./routes/authTest.route.js";
import debugAuthRouter from "./routes/debugAuth.route.js";
import path from "path";

// dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error: " + err);
  });

const __dirname = path.resolve();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://real-estate-project-front-end.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", transactionRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/transactions", transactionSaveRouter);
app.use("/api/revenue", revenueRouter);
app.use("/api/chat", chatRouter);
app.use("/api/forgot-password", forgotPasswordRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/user-profile", userProfileRouter);
app.use("/api/auth-test", authTestRouter);
app.use("/api/debug", debugAuthRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running' });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});