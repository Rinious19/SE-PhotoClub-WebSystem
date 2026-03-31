import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/AuthRoutes";
import photoRoutes from "./routes/PhotoRoutes";
import eventRoutes from "./routes/EventRoutes";
import activityRoutes from "./routes/ActivityRoutes";
import voteRoutes from "./routes/VoteRoutes";
import adminRoutes from "./routes/AdminRoutes";
import historyRoutes from "./routes/HistoryRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/history", historyRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "PhotoClub API is running" });
});

// Root route — explains the API is running (prevents confusing 404)
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "SE PhotoClub API",
    version: "1.0.0",
    endpoints: [
      "/health",
      "/api/auth",
      "/api/photos",
      "/api/events",
      "/api/activities",
      "/api/votes",
      "/api/admin",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;