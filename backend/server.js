import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import projectRoutes from "./routes/projectRoutes.js";
import mockRoutes from "./routes/mockRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 API Mocking Service is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      projects: "/api/projects", 
      mocks: "/api-mocks"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api-mocks", mockRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    availableRoutes: ["/api/auth", "/api/projects", "/api-mocks"]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 API Base: http://localhost:${PORT}`);
});