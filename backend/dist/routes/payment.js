"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const razorpayInstance = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
router.post("/create-order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const order = yield razorpayInstance.orders.create(options);
        res.status(200).json(order);
    }
    catch (error) {
        console.error("Razorpay Create Order Error:", error);
        res.status(500).json({ message: "Error creating Razorpay Order" });
    }
}));
router.post("/verify", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET || '';
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto_1.default
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");
        const isAuthentic = expectedSignature === razorpay_signature;
        if (isAuthentic) {
            res.status(200).json({ message: "Payment verified successfully", paymentId: razorpay_payment_id });
        }
        else {
            res.status(400).json({ message: "Invalid Signature" });
        }
    }
    catch (error) {
        console.error("Razorpay Verification Error:", error);
        res.status(500).json({ message: "Error verifying payment" });
    }
}));
exports.default = router;
