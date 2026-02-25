import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { put } from "@vercel/blob";
import { getDb } from "../database";
import { authenticateToken } from "../middleware/authMiddleware";

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
