import { Router, Request, Response } from "express";
import multer from "multer";
import { put } from "@vercel/blob";
import { getDb } from "../database";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", authenticateToken, requireAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file provided" });
      return;
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res.status(500).json({ message: "Vercel Blob token not configured." });
      return;
    }
    const uniquePrefix = `LAS/${Date.now()}-${Math.round(Math.random() * 1E9)}-`;
    const blob = await put(uniquePrefix + req.file.originalname, req.file.buffer, {
      access: 'public',
    });
    res.json({ url: blob.url });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Error uploading file to Blob" });
  }
});

router.get("/bookings", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    
    const allBookings = await db.all(`
      SELECT b.*, 
             a.street as addressStreet, 
             a.city as addressCity, 
             a.state as addressState, 
             a.zip as addressZip 
      FROM bookings b 
      LEFT JOIN addresses a ON b.addressId = a.id 
      ORDER BY b.createdAt DESC
    `);
    
    const allUsers = await db.all('SELECT id, email, name, role FROM users'); 
    
    const formattedBookings = allBookings.map(b => {
       const { addressStreet, addressCity, addressState, addressZip, ...rest } = b;
       
       let addressObj = null;
       if (b.addressId && addressStreet) {
         addressObj = {
            id: b.addressId,
            street: addressStreet,
            city: addressCity,
            state: addressState,
            zip: addressZip
         };
       }
       
       return {
         ...rest,
         deliveryAddress: addressObj
       };
    });

    res.json({ bookings: formattedBookings, users: allUsers });
  } catch (err) {
    console.error("Admin Bookings Error:", err);
    res.status(500).json({ message: "Error fetching admin data" });
  }
});

router.put("/bookings/:id/status", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'rejected', 'cancelled'].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }
    const db = await getDb();
    
    let query = 'UPDATE bookings SET status = ? WHERE id = ?';
    let params = [status, req.params.id];
    
    if (status === 'cancelled') {
      query = 'UPDATE bookings SET status = ?, refundStatus = ? WHERE id = ?';
      params = [status, 'pending', req.params.id];
    } else {
       // Clear refund status if un-cancelled
       query = 'UPDATE bookings SET status = ?, refundStatus = NULL WHERE id = ?';
    }
    
    const result = await db.run(query, params);
    
    if (result.changes === 0) {
      res.status(404).json({ message: "Booking not found" });
    } else {
      res.json({ message: `Booking marked as ${status}` });
    }
  } catch (err) {
    console.error("Update Booking Status Error:", err);
    res.status(500).json({ message: "Error updating booking status" });
  }
});

router.put("/bookings/:id/refund", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.run('UPDATE bookings SET refundStatus = ? WHERE id = ? AND status = ?', ['processed', req.params.id, 'cancelled']);
    
    if (result.changes === 0) {
      res.status(404).json({ message: "Booking not found or not cancelled" });
    } else {
      res.json({ message: `Refund marked as processed` });
    }
  } catch (err) {
    console.error("Update Refund Status Error:", err);
    res.status(500).json({ message: "Error updating refund status" });
  }
});

export default router;
