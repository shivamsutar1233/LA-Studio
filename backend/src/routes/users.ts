import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { put } from "@vercel/blob";
import { getDb } from "../database";
import { authenticateToken } from "../middleware/authMiddleware";
import { sendOtpEmail } from "../utils/mailer";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
const upload = multer({ storage: multer.memoryStorage() });

router.put("/users/me", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;
    const user = (req as any).user;
    const db = await getDb();

    if (email !== user.email) {
      const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, user.id]);
      if (existingUser) {
        res.status(400).json({ message: "Email already in use" });
        return;
      }
    }

    await db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, user.id]);

    const updatedUser = await db.get('SELECT id, email, name, role FROM users WHERE id = ?', user.id);

    const payload = { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name };
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: "Profile updated", user: updatedUser, token: newToken });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

router.get("/users/me/addresses", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const db = await getDb();
    const addresses = await db.all('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC', user.id);
    res.json(addresses);
  } catch (error) {
    console.error("Fetch Addresses Error:", error);
    res.status(500).json({ message: "Server error fetching addresses" });
  }
});

router.post("/users/me/addresses", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { street, city, state, zip, isDefault } = req.body;
    const db = await getDb();

    const addressId = Math.random().toString(36).substr(2, 9);

    if (isDefault) {
      await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', user.id);
    }

    const existingCount = await db.get('SELECT COUNT(*) as count FROM addresses WHERE userId = ?', user.id);
    const finalIsDefault = (isDefault || existingCount.count === 0) ? 1 : 0;

    await db.run(
      'INSERT INTO addresses (id, userId, street, city, state, zip, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [addressId, user.id, street, city, state, zip, finalIsDefault]
    );

    const newAddress = await db.get('SELECT * FROM addresses WHERE id = ?', addressId);
    res.status(201).json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    console.error("Add Address Error:", error);
    res.status(500).json({ message: "Server error adding address" });
  }
});

router.post("/user/upload", authenticateToken, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file provided" });
      return;
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res.status(500).json({ message: "Vercel Blob token not configured." });
      return;
    }
    const uniquePrefix = `LAS-USER/${Date.now()}-${Math.round(Math.random() * 1E9)}-`;
    const blob = await put(uniquePrefix + req.file.originalname, req.file.buffer, {
      access: 'public',
    });
    res.json({ url: blob.url });
  } catch (err) {
    console.error("User Upload Error:", err);
    res.status(500).json({ message: "Error uploading user file to Blob" });
  }
});

export default router;

// ─── Email Change OTP Routes ──────────────────────────────────────────────────

// Step 1: Request email change → sends OTP to CURRENT email
router.post("/users/request-email-change", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { newEmail } = req.body;
    const user = (req as any).user;
    const db = await getDb();

    if (!newEmail || newEmail === user.email) {
      res.status(400).json({ message: "Please provide a different new email address." });
      return;
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', newEmail);
    if (existing) {
      res.status(400).json({ message: "This email is already in use by another account." });
      return;
    }

    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    await db.run(
      'UPDATE users SET pendingEmail = ?, emailChangeOtp = ?, emailChangeOtpExpiry = ?, emailChangeStep = ? WHERE id = ?',
      [newEmail, otp, expiry, 'verify-old', user.id]
    );

    const dbUser = await db.get('SELECT name FROM users WHERE id = ?', user.id);
    await sendOtpEmail(user.email, dbUser.name, otp, expiry);

    res.json({ message: `A verification code has been sent to your current email (${user.email}).` });
  } catch (error) {
    console.error("Request Email Change Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Step 2: Verify OTP on OLD email → sends OTP to NEW email
router.post("/users/verify-old-email-otp", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp } = req.body;
    const user = (req as any).user;
    const db = await getDb();

    const dbUser = await db.get('SELECT * FROM users WHERE id = ?', user.id);

    if (!dbUser.emailChangeOtp || dbUser.emailChangeStep !== 'verify-old') {
      res.status(400).json({ message: "No pending email change request found. Please start the process again." });
      return;
    }

    if (Date.now() > Number(dbUser.emailChangeOtpExpiry)) {
      res.status(400).json({ message: "OTP has expired. Please start the process again." });
      return;
    }

    if (String(dbUser.emailChangeOtp) !== String(otp)) {
      res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
      return;
    }

    // Send new OTP to the new email
    const newOtp = generateOtp();
    const newExpiry = Date.now() + 10 * 60 * 1000;

    await db.run(
      'UPDATE users SET emailChangeOtp = ?, emailChangeOtpExpiry = ?, emailChangeStep = ? WHERE id = ?',
      [newOtp, newExpiry, 'verify-new', user.id]
    );

    await sendOtpEmail(dbUser.pendingEmail, dbUser.name, newOtp, newExpiry);

    res.json({ message: `A verification code has been sent to your new email (${dbUser.pendingEmail}).` });
  } catch (error) {
    console.error("Verify Old Email OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Step 3: Verify OTP on NEW email → update email
router.post("/users/verify-new-email-otp", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp } = req.body;
    const user = (req as any).user;
    const db = await getDb();
    const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

    const dbUser = await db.get('SELECT * FROM users WHERE id = ?', user.id);

    if (!dbUser.emailChangeOtp || dbUser.emailChangeStep !== 'verify-new') {
      res.status(400).json({ message: "No pending email verification found. Please start the process again." });
      return;
    }

    if (Date.now() > Number(dbUser.emailChangeOtpExpiry)) {
      res.status(400).json({ message: "OTP has expired. Please start the process again." });
      return;
    }

    if (String(dbUser.emailChangeOtp) !== String(otp)) {
      res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
      return;
    }

    // Update email and clear temporary fields
    await db.run(
      'UPDATE users SET email = ?, pendingEmail = NULL, emailChangeOtp = NULL, emailChangeOtpExpiry = NULL, emailChangeStep = NULL WHERE id = ?',
      [dbUser.pendingEmail, user.id]
    );

    const updatedUser = await db.get('SELECT id, email, name, role FROM users WHERE id = ?', user.id);
    const payload = { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name };
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: "Email updated successfully!", user: updatedUser, token: newToken });
  } catch (error) {
    console.error("Verify New Email OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
