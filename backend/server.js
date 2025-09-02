import express from "express";
import dotenv from "dotenv";
import cors from "cors";       // ✅ import cors
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// ✅ Enable CORS for your frontend origin
app.use(cors({
  origin: "http://localhost:3000", // allow requests from frontend
  credentials: true,               // if you need cookies/auth headers
}));

// Use routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
