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
