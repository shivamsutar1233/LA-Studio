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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const authMiddleware_1 = require("../middleware/authMiddleware");
const mailer_1 = require("../utils/mailer");
const mailer_2 = require("../utils/mailer");
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, role } = req.body;
        const db = yield (0, database_1.getDb)();
        const existingUser = yield db.get('SELECT id FROM users WHERE email = ?', email);
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const userId = Math.random().toString(36).substr(2, 9);
        const userRole = role === 'admin' ? 'admin' : 'user';
        const verifyToken = Math.random().toString(36).substr(2, 12) + Math.random().toString(36).substr(2, 12);
        yield db.run('INSERT INTO users (id, email, name, password, role, isEmailVerified, verificationToken) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, email, name, hashedPassword, userRole, 0, verifyToken]);
        // Send verification email
        yield (0, mailer_1.sendVerificationEmail)(email, name, verifyToken);
        res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
}));
router.get("/verify", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token) {
            res.status(400).json({ message: "Verification token is required" });
            return;
        }
        const db = yield (0, database_1.getDb)();
        const user = yield db.get('SELECT id FROM users WHERE verificationToken = ?', token);
        if (!user) {
            res.status(400).json({ message: "Invalid or expired verification token" });
            return;
        }
        yield db.run('UPDATE users SET isEmailVerified = 1, verificationToken = NULL WHERE id = ?', user.id);
        res.json({ message: "Email verified successfully" });
    }
    catch (error) {
        console.error("Verify Email Error:", error);
        res.status(500).json({ message: "Server error during email verification" });
    }
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const db = yield (0, database_1.getDb)();
        const user = yield db.get('SELECT * FROM users WHERE email = ?', email);
        if (!user) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        if (user.isEmailVerified === 0) {
            res.status(403).json({ message: "Please verify your email address before logging in." });
            return;
        }
        const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: payload });
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
}));
router.get("/me", authMiddleware_1.authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
exports.default = router;
// ─── Forgot Password (OTP-based) ───────────────────────────────────────────
// Step 1: Request password reset OTP
router.post("/forgot-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const db = yield (0, database_1.getDb)();
        const user = yield db.get('SELECT id, name, email FROM users WHERE email = ?', email);
        // Always return success to prevent email enumeration
        if (!user) {
            res.json({ message: "If that email is registered, an OTP will be sent." });
            return;
        }
        const otp = generateOtp();
        const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        yield db.run('UPDATE users SET resetPasswordToken = ?, resetPasswordExpiry = ? WHERE id = ?', [otp, expiry, user.id]);
        yield (0, mailer_2.sendOtpEmail)(user.email, user.name, otp, expiry);
        res.json({ message: "If that email is registered, an OTP will be sent." });
    }
    catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
// Step 2: Verify OTP (without changing password yet)
router.post("/verify-reset-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        const db = yield (0, database_1.getDb)();
        const user = yield db.get('SELECT id, resetPasswordToken, resetPasswordExpiry FROM users WHERE email = ?', email);
        if (!user || !user.resetPasswordToken) {
            res.status(400).json({ message: "Invalid request. Please start the process again." });
            return;
        }
        if (Date.now() > Number(user.resetPasswordExpiry)) {
            res.status(400).json({ message: "OTP has expired. Please request a new one." });
            return;
        }
        if (String(user.resetPasswordToken) !== String(otp)) {
            res.status(400).json({ message: "Invalid OTP. Please check and try again." });
            return;
        }
        res.json({ message: "OTP verified. You can now set a new password." });
    }
    catch (error) {
        console.error("Verify Reset OTP Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
// Step 3: Reset password (re-validates OTP then updates password)
router.post("/reset-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters." });
            return;
        }
        const db = yield (0, database_1.getDb)();
        const user = yield db.get('SELECT id, resetPasswordToken, resetPasswordExpiry FROM users WHERE email = ?', email);
        if (!user || !user.resetPasswordToken) {
            res.status(400).json({ message: "Invalid request. Please start the process again." });
            return;
        }
        if (Date.now() > Number(user.resetPasswordExpiry)) {
            res.status(400).json({ message: "OTP has expired. Please request a new one." });
            return;
        }
        if (String(user.resetPasswordToken) !== String(otp)) {
            res.status(400).json({ message: "Invalid OTP." });
            return;
        }
        const bcrypt = require('bcryptjs');
        const salt = yield bcrypt.genSalt(10);
        const hashedPassword = yield bcrypt.hash(newPassword, salt);
        yield db.run('UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpiry = NULL WHERE id = ?', [hashedPassword, user.id]);
        res.json({ message: "Password has been reset successfully." });
    }
    catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}));
