import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { initDb } from "./database";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import gearRoutes from "./routes/gears";
import bookingRoutes from "./routes/bookings";
import adminRoutes from "./routes/admin";
import paymentRoutes from "./routes/payment";

const app: Express = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:3000",
  "https://leananglestudio.shop",
  "https://www.leananglestudio.shop",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list or if it's a localhost origin
    if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

// ==========================================
// REGISTER ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/gears", gearRoutes);
app.use("/api", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);

// Initialize DB and start server
initDb().then(() => {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port} with SQLite DB`);
  });
}).catch(err => {
  console.error("Failed to initialize database", err);
  process.exit(1);
});
