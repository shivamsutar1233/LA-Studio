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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const blob_1 = require("@vercel/blob");
const database_1 = require("../database");
const authMiddleware_1 = require("../middleware/authMiddleware");
const mailer_1 = require("../utils/mailer");
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.put("/users/me", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email } = req.body;
        const user = req.user;
        const db = yield (0, database_1.getDb)();
        if (email !== user.email) {
            const existingUser = yield db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, user.id]);
            if (existingUser) {
                res.status(400).json({ message: "Email already in use" });
                return;
            }
        }
        yield db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, user.id]);
        const updatedUser = yield db.get('SELECT id, email, name, role FROM users WHERE id = ?', user.id);
        const payload = { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name };
        const newToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Profile updated", user: updatedUser, token: newToken });
    }
    catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Server error updating profile" });
    }
}));
router.get("/users/me/addresses", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const db = yield (0, database_1.getDb)();
        const addresses = yield db.all('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC', user.id);
        res.json(addresses);
    }
    catch (error) {
        console.error("Fetch Addresses Error:", error);
        res.status(500).json({ message: "Server error fetching addresses" });
    }
}));
router.post("/users/me/addresses", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { street, city, state, zip, isDefault } = req.body;
        const db = yield (0, database_1.getDb)();
        const addressId = Math.random().toString(36).substr(2, 9);
        if (isDefault) {
            yield db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', user.id);
        }
        const existingCount = yield db.get('SELECT COUNT(*) as count FROM addresses WHERE userId = ?', user.id);
        const finalIsDefault = (isDefault || existingCount.count === 0) ? 1 : 0;
        yield db.run('INSERT INTO addresses (id, userId, street, city, state, zip, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?)', [addressId, user.id, street, city, state, zip, finalIsDefault]);
        const newAddress = yield db.get('SELECT * FROM addresses WHERE id = ?', addressId);
        res.status(201).json({ message: "Address added successfully", address: newAddress });
    }
    catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ message: "Server error adding address" });
    }
}));
router.post("/user/upload", authMiddleware_1.authenticateToken, upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const blob = yield (0, blob_1.put)(uniquePrefix + req.file.originalname, req.file.buffer, {
            access: 'public',
        });
        res.json({ url: blob.url });
    }
    catch (err) {
        console.error("User Upload Error:", err);
        res.status(500).json({ message: "Error uploading user file to Blob" });
    }
}));
exports.default = router;
// ─── Email Change OTP Routes ──────────────────────────────────────────────────
// Step 1: Request email change → sends OTP to CURRENT email
router.post("/users/request-email-change", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newEmail } = req.body;
        const user = req.user;
        const db = yield (0, database_1.getDb)();
        if (!newEmail || newEmail === user.email) {
            res.status(400).json({ message: "Please provide a different new email address." });
            return;
        }
        const existing = yield db.get('SELECT id FROM users WHERE email = ?', newEmail);
        if (existing) {
            res.status(400).json({ message: "This email is already in use by another account." });
            return;
        }
        const otp = generateOtp();
        const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        yield db.run('UPDATE users SET pendingEmail = ?, emailChangeOtp = ?, emailChangeOtpExpiry = ?, emailChangeStep = ? WHERE id = ?', [newEmail, otp, expiry, 'verify-old', user.id]);
        const dbUser = yield db.get('SELECT name FROM users WHERE id = ?', user.id);
        yield (0, mailer_1.sendOtpEmail)(user.email, dbUser.name, otp, expiry);
        res.json({ message: `A verification code has been sent to your current email (${user.email}).` });
    }
    catch (error) {
        console.error("Request Email Change Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
// Step 2: Verify OTP on OLD email → sends OTP to NEW email
router.post("/users/verify-old-email-otp", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp } = req.body;
        const user = req.user;
        const db = yield (0, database_1.getDb)();
        const dbUser = yield db.get('SELECT * FROM users WHERE id = ?', user.id);
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
        yield db.run('UPDATE users SET emailChangeOtp = ?, emailChangeOtpExpiry = ?, emailChangeStep = ? WHERE id = ?', [newOtp, newExpiry, 'verify-new', user.id]);
        yield (0, mailer_1.sendOtpEmail)(dbUser.pendingEmail, dbUser.name, newOtp, newExpiry);
        res.json({ message: `A verification code has been sent to your new email (${dbUser.pendingEmail}).` });
    }
    catch (error) {
        console.error("Verify Old Email OTP Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
// Step 3: Verify OTP on NEW email → update email
router.post("/users/verify-new-email-otp", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp } = req.body;
        const user = req.user;
        const db = yield (0, database_1.getDb)();
        const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
        const dbUser = yield db.get('SELECT * FROM users WHERE id = ?', user.id);
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
        yield db.run('UPDATE users SET email = ?, pendingEmail = NULL, emailChangeOtp = NULL, emailChangeOtpExpiry = NULL, emailChangeStep = NULL WHERE id = ?', [dbUser.pendingEmail, user.id]);
        const updatedUser = yield db.get('SELECT id, email, name, role FROM users WHERE id = ?', user.id);
        const payload = { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name };
        const newToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Email updated successfully!", user: updatedUser, token: newToken });
    }
    catch (error) {
        console.error("Verify New Email OTP Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
