import express from 'express';
import crypto from 'crypto';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import { put } from '@vercel/blob';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// GET reviews for a specific target (gear or bundle)
router.get('/:targetId', async (req, res) => {
  try {
    const db = await getDb();
    const reviews = await db.all(
      `SELECT r.*, u.name as userName 
       FROM reviews r 
       JOIN users u ON r.userId = u.id 
       WHERE r.targetId = ? 
       ORDER BY r.createdAt DESC`,
      [req.params.targetId]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST media upload for reviews
router.post('/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ message: "Vercel Blob token not configured." });
    }

    const uniquePrefix = `reviews/${Date.now()}-${Math.round(Math.random() * 1E9)}-`;
    const blob = await put(uniquePrefix + req.file.originalname, req.file.buffer, {
      access: 'public',
    });

    res.json({ url: blob.url });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Error uploading file" });
  }
});

// POST a new review
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { targetId, targetType, rating, comment, mediaUrls } = req.body;
    const userId = req.user.id;

    if (!targetId || !targetType || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDb();
    
    // Check if user already reviewed this item
    const existingReview = await db.get(
      'SELECT id FROM reviews WHERE userId = ? AND targetId = ?',
      [userId, targetId]
    );

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await db.run(
      'INSERT INTO reviews (id, userId, targetId, targetType, rating, comment, createdAt, mediaUrls) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, targetId, targetType, rating, comment, createdAt, mediaUrls || '[]']
    );

    const newReview = await db.get(
      'SELECT r.*, u.name as userName FROM reviews r JOIN users u ON r.userId = u.id WHERE r.id = ?',
      [id]
    );

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

export default router;
