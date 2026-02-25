import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

router.post("/create-order", async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency } = req.body; 
    
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

router.post("/verify", async (req: Request, res: Response): Promise<void> => {
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
      res.status(200).json({ message: "Payment verified successfully", paymentId: razorpay_payment_id });
    } else {
      res.status(400).json({ message: "Invalid Signature" });
    }
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
});

export default router;
