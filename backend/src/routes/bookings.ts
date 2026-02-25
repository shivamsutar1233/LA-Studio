import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/rentals", authenticateToken, async (req: Request, res: Response): Promise<void> => {
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

router.get("/bookings", authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const db = await getDb();
    const userBookings = await db.all('SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC', user.id);
    res.json(userBookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

router.put("/bookings/:id/cancel", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const bookingId = req.params.id;

  try {
    const db = await getDb();
    const booking = await db.get('SELECT * FROM bookings WHERE id = ? AND userId = ?', [bookingId, user.id]);

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      res.status(400).json({ message: `Booking cannot be cancelled because it is already ${booking.status}` });
      return;
    }

    await db.run('UPDATE bookings SET status = ?, refundStatus = ? WHERE id = ?', ['cancelled', 'pending', bookingId]);

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    res.status(500).json({ message: "Error cancelling booking" });
  }
});

router.post("/bookings/:id/aadhaar/generate-otp", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { aadhaarNumber } = req.body;
    const user = (req as any).user;
    const bookingId = req.params.id;

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      res.status(400).json({ message: "Valid 12-digit Aadhaar number is required" });
      return;
    }

    const db = await getDb();
    const booking = await db.get('SELECT * FROM bookings WHERE id = ? AND userId = ?', [bookingId, user.id]);
    
    if (!booking || booking.status !== 'confirmed') {
      res.status(404).json({ message: "Booking not found or not eligible for undertaking" });
      return;
    }
    if (booking.undertakingSigned) {
      res.status(400).json({ message: "Undertaking already signed" });
      return;
    }

    const API_KEY = process.env.AADHAAR_API_KEY || "";
    const API_URL = process.env.AADHAAR_GENERATE_OTP_URL || "https://sandbox.surepass.io/api/v1/aadhaar-v2/generate-otp";

    if (!API_KEY) {
      console.log(`[MOCK API] Generating OTP for Aadhaar: ${aadhaarNumber}`);
      res.json({ clientId: "mock_client_" + Date.now(), message: "OTP Sent Successfully (Mock)" });
      return;
    }

    const response = await fetch(API_URL, {
       method: "POST",
       headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
       body: JSON.stringify({ id_number: aadhaarNumber })
    });
    
    const data = await response.json() as any;
    
    if (response.ok && data.status_code === 200 && data.data?.client_id) {
       res.json({ clientId: data.data.client_id, message: "OTP Sent Successfully" });
    } else {
       res.status(400).json({ message: data.message || "Failed to generate OTP from Aadhaar authority" });
    }

  } catch (err) {
    console.error("Generate OTP Error:", err);
    res.status(500).json({ message: "Server error generating OTP" });
  }
});

router.post("/bookings/:id/aadhaar/submit-otp", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, otp, aadhaarNumber, aadhaarUrl } = req.body;
    const user = (req as any).user;
    const bookingId = req.params.id;

    if (!clientId || !otp) {
      res.status(400).json({ message: "Client ID and OTP are required" });
      return;
    }

    const API_KEY = process.env.AADHAAR_API_KEY || "";
    const API_URL = process.env.AADHAAR_SUBMIT_OTP_URL || "https://sandbox.surepass.io/api/v1/aadhaar-v2/submit-otp";

    let aadhaarDetailsUrl = aadhaarUrl || "";

    if (!API_KEY) {
      console.log(`[MOCK API] Verifying OTP: ${otp} for Client: ${clientId}`);
      if (otp !== '123456') {
         res.status(400).json({ message: "Invalid Mock OTP. Please use 123456." });
         return;
      }
      if (!aadhaarDetailsUrl) aadhaarDetailsUrl = "https://example.com/mock_kyc_document.pdf"; 
    } else {
      const response = await fetch(API_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
         body: JSON.stringify({ client_id: clientId, otp })
      });
      
      const data = await response.json() as any;
      
      if (response.ok && data.status_code === 200) {
         if (!aadhaarDetailsUrl) aadhaarDetailsUrl = data.data?.profile_image || "verified_via_api";
      } else {
         res.status(400).json({ message: data.message || "Invalid OTP or Verification Failed" });
         return;
      }
    }

    const db = await getDb();
    await db.run(
      'UPDATE bookings SET undertakingSigned = 1, aadhaarNumber = ?, aadhaarUrl = ? WHERE id = ?',
      [aadhaarNumber, aadhaarDetailsUrl, bookingId]
    );

    res.json({ message: "Undertaking signed and Aadhaar verified successfully!" });

  } catch (err) {
    console.error("Submit OTP Error:", err);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
});

export default router;
