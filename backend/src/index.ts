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
  process.env.FRONTEND_URL || "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // For strictly browser-only frontend, you can remove the !origin check
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
