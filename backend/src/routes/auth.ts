import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../database";
import { authenticateToken } from "../middleware/authMiddleware";
import { sendVerificationEmail } from "../utils/mailer";
import { sendOtpEmail } from "../utils/mailer";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;
    const db = await getDb();

    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = Math.random().toString(36).substr(2, 9);
    const userRole = role === 'admin' ? 'admin' : 'user';
    const verifyToken = Math.random().toString(36).substr(2, 12) + Math.random().toString(36).substr(2, 12);

    await db.run('INSERT INTO users (id, email, name, password, role, isEmailVerified, verificationToken) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, email, name, hashedPassword, userRole, 0, verifyToken]);

    // Send verification email
    await sendVerificationEmail(email, name, verifyToken);

    res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.get("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400).json({ message: "Verification token is required" });
      return;
    }

    const db = await getDb();
    const user = await db.get('SELECT id FROM users WHERE verificationToken = ?', token as string);

    if (!user) {
      res.status(400).json({ message: "Invalid or expired verification token" });
      return;
    }

    await db.run('UPDATE users SET isEmailVerified = 1, verificationToken = NULL WHERE id = ?', user.id);

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ message: "Server error during email verification" });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const db = await getDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', email);

    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    if (user.isEmailVerified === 0) {
      res.status(403).json({ message: "Please verify your email address before logging in." });
      return;
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: payload });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

router.get("/me", authenticateToken, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

export default router;

// ─── Forgot Password (OTP-based) ───────────────────────────────────────────

// Step 1: Request password reset OTP
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ message: "Email is required" }); return; }

    const db = await getDb();
    const user = await db.get('SELECT id, name, email FROM users WHERE email = ?', email);

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: "If that email is registered, an OTP will be sent." });
      return;
    }

    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await db.run('UPDATE users SET resetPasswordToken = ?, resetPasswordExpiry = ? WHERE id = ?', [otp, expiry, user.id]);
    await sendOtpEmail(user.email, user.name, otp, expiry);

    res.json({ message: "If that email is registered, an OTP will be sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Step 2: Verify OTP (without changing password yet)
router.post("/verify-reset-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const db = await getDb();
    const user = await db.get('SELECT id, resetPasswordToken, resetPasswordExpiry FROM users WHERE email = ?', email);

    if (!user || !user.resetPasswordToken) {
      res.status(400).json({ message: "Invalid request. Please start the process again." }); return;
    }
    if (Date.now() > Number(user.resetPasswordExpiry)) {
      res.status(400).json({ message: "OTP has expired. Please request a new one." }); return;
    }
    if (String(user.resetPasswordToken) !== String(otp)) {
      res.status(400).json({ message: "Invalid OTP. Please check and try again." }); return;
    }

    res.json({ message: "OTP verified. You can now set a new password." });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Step 3: Reset password (re-validates OTP then updates password)
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters." }); return;
    }

    const db = await getDb();
    const user = await db.get('SELECT id, resetPasswordToken, resetPasswordExpiry FROM users WHERE email = ?', email);

    if (!user || !user.resetPasswordToken) {
      res.status(400).json({ message: "Invalid request. Please start the process again." }); return;
    }
    if (Date.now() > Number(user.resetPasswordExpiry)) {
      res.status(400).json({ message: "OTP has expired. Please request a new one." }); return;
    }
    if (String(user.resetPasswordToken) !== String(otp)) {
      res.status(400).json({ message: "Invalid OTP." }); return;
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.run(
      'UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
