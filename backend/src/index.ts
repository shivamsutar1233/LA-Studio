import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { initDb, getDb } from "./database";
import multer from "multer";
import { put } from "@vercel/blob";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

// Razorpay Instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

app.use(cors());
app.use(express.json());

// ==========================================
// SQLITE MIGRATION: In-memory arrays removed.
// ==========================================

// ==========================================
// MIDDLEWARE
// ==========================================
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ message: "Invalid or expired token" });
      return;
    }
    (req as any).user = user;
    next();
  });
};

const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if ((req as any).user?.role !== 'admin') {
     res.status(403).json({ message: "Admin access required" });
     return;
  }
  next();
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post("/api/auth/register", async (req: Request, res: Response): Promise<void> => {
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
    
    await db.run('INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)', [userId, email, name, hashedPassword, userRole]);
    
    res.status(201).json({ message: "User registered successfully", userId });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response): Promise<void> => {
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

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ token, user: payload });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.get("/api/auth/me", authenticateToken, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

app.put("/api/users/me", authenticateToken, async (req: Request, res: Response): Promise<void> => {
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
    
    // Sign new token to refresh payload claims
    const payload = { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name };
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: "Profile updated", user: updatedUser, token: newToken });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

app.get("/api/users/me/addresses", authenticateToken, async (req: Request, res: Response): Promise<void> => {
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

app.post("/api/users/me/addresses", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { street, city, state, zip, isDefault } = req.body;
    const db = await getDb();
    
    const addressId = Math.random().toString(36).substr(2, 9);
    
    // If setting as default, unset others for this user
    if (isDefault) {
      await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', user.id);
    }
    
    // If it's the user's first address, force it to be default
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

// ==========================================
// GEAR ROUTES
// ==========================================
app.get("/api/gears", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const gearsData = await db.all('SELECT * FROM gears');
    res.json(gearsData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching gears" });
  }
});

app.get("/api/gears/:id", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const gear = await db.get('SELECT * FROM gears WHERE id = ?', req.params.id);
    if (!gear) {
      res.status(404).json({ message: "Gear not found" });
    } else {
      res.json(gear);
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching gear" });
  }
});

// ==========================================
// BOOKING/RENTAL & ADMIN UPLOAD ROUTES
// ==========================================

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/admin/upload", authenticateToken, requireAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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

// Create new gear (Admin only)
app.post("/api/gears", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category, pricePerDay, thumbnail, images } = req.body;
    const db = await getDb();
    const newId = Math.random().toString(36).substr(2, 9);
    
    await db.run(
      'INSERT INTO gears (id, name, category, pricePerDay, thumbnail, images) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, name, category, pricePerDay, thumbnail || '', images || '[]']
    );
    
    const newGear = await db.get('SELECT * FROM gears WHERE id = ?', newId);
    res.status(201).json({ message: "Gear created successfully", gear: newGear });
  } catch (err) {
    console.error("Create Gear Error:", err);
    res.status(500).json({ message: "Error creating gear" });
  }
});

// Update gear (Admin only)
app.put("/api/gears/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category, pricePerDay, thumbnail, images } = req.body;
    const db = await getDb();
    
    await db.run(
      'UPDATE gears SET name = ?, category = ?, pricePerDay = ?, thumbnail = ?, images = ? WHERE id = ?',
      [name, category, pricePerDay, thumbnail || '', images || '[]', req.params.id]
    );
    
    const updatedGear = await db.get('SELECT * FROM gears WHERE id = ?', req.params.id);
    if (!updatedGear) {
      res.status(404).json({ message: "Gear not found" });
    } else {
      res.json({ message: "Gear updated successfully", gear: updatedGear });
    }
  } catch (err) {
    console.error("Update Gear Error:", err);
    res.status(500).json({ message: "Error updating gear" });
  }
});

// Delete gear (Admin only)
app.delete("/api/gears/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.run('DELETE FROM gears WHERE id = ?', req.params.id);
    
    if (result.changes === 0) {
      res.status(404).json({ message: "Gear not found" });
    } else {
      res.json({ message: "Gear deleted successfully" });
    }
  } catch (err) {
    console.error("Delete Gear Error:", err);
    res.status(500).json({ message: "Error deleting gear" });
  }
});

// Create booking
app.post("/api/rentals", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { gearId, startDate, endDate, customerDetails, cartItems, addressId } = req.body;
  
  const user = (req as any).user;
  const userId = user.id;

  const createdAt = new Date().toISOString();
  const custName = customerDetails?.name || null;

  try {
    const db = await getDb();
    const bookingId = Math.random().toString(36).substr(2, 9);
    
    let finalGearIds;
    if (cartItems && Array.isArray(cartItems)) {
        finalGearIds = JSON.stringify(cartItems);
    } else {
        const gearIdsArray = gearId ? gearId.split(',').map((id: string) => id.trim()) : [];
        finalGearIds = JSON.stringify(gearIdsArray);
    }
    
    await db.run(
      'INSERT INTO bookings (id, userId, gearIds, startDate, endDate, status, customerName, createdAt, addressId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bookingId, userId, finalGearIds, startDate, endDate, 'pending', custName, createdAt, addressId || null]
    );

    res.status(201).json({
      message: "Rental booked successfully",
      rental: { id: bookingId, userId, gearIds: finalGearIds, startDate, endDate, status: "pending", addressId },
    });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ message: "Error mapping booking" });
  }
});

// Get bookings for current user
app.get("/api/bookings", authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const db = await getDb();
    const userBookings = await db.all('SELECT * FROM bookings WHERE userId = ?', user.id);
    res.json(userBookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Get ALL bookings (Admin only)
app.get("/api/admin/bookings", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    
    // Use a LEFT JOIN to fetch addresses linked to bookings
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
    
    const allUsers = await db.all('SELECT id, email, name, role FROM users'); // Excluding password
    
    // Map the flat row back to nested structure
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

// Update booking status (Admin only)
app.put("/api/admin/bookings/:id/status", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }
    const db = await getDb();
    const result = await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    
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

// ==========================================
// RAZORPAY PAYMENT ROUTES
// ==========================================

// Create a Razorpay Order
app.post("/api/payment/create-order", async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency } = req.body; // Amount should be in smallest unit (paise)
    
    if (!amount) {
      res.status(400).json({ message: "Amount is required" });
      return;
    }

    const options = {
      amount: amount, 
      currency: currency || "INR",
      receipt: `receipt_${Math.random().toString(36).substring(2, 9)}`,
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ message: "Error creating Razorpay Order" });
  }
});

// Verify a Razorpay Signature
app.post("/api/payment/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Signature verified successfully
      res.status(200).json({ message: "Payment verified successfully", paymentId: razorpay_payment_id });
    } else {
      res.status(400).json({ message: "Invalid Signature" });
    }
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
});

// Initialize DB and start server
initDb().then(() => {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port} with SQLite DB`);
  });
}).catch(err => {
  console.error("Failed to initialize database", err);
  process.exit(1);
});
