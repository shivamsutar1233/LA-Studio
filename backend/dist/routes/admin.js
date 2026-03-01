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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const blob_1 = require("@vercel/blob");
const database_1 = require("../database");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/upload", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const blob = yield (0, blob_1.put)(uniquePrefix + req.file.originalname, req.file.buffer, {
            access: 'public',
        });
        res.json({ url: blob.url });
    }
    catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: "Error uploading file to Blob" });
    }
}));
router.get("/bookings", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const allBookings = yield db.all(`
      SELECT b.*, 
             a.street as addressStreet, 
             a.city as addressCity, 
             a.state as addressState, 
             a.zip as addressZip 
      FROM bookings b 
      LEFT JOIN addresses a ON b.addressId = a.id 
      ORDER BY b.createdAt DESC
    `);
        const allUsers = yield db.all('SELECT id, email, name, role FROM users');
        const formattedBookings = allBookings.map(b => {
            const { addressStreet, addressCity, addressState, addressZip } = b, rest = __rest(b, ["addressStreet", "addressCity", "addressState", "addressZip"]);
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
            return Object.assign(Object.assign({}, rest), { deliveryAddress: addressObj });
        });
        res.json({ bookings: formattedBookings, users: allUsers });
    }
    catch (err) {
        console.error("Admin Bookings Error:", err);
        res.status(500).json({ message: "Error fetching admin data" });
    }
}));
router.put("/bookings/:id/status", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        if (!['pending', 'confirmed', 'rejected', 'cancelled'].includes(status)) {
            res.status(400).json({ message: "Invalid status" });
            return;
        }
        const db = yield (0, database_1.getDb)();
        let query = 'UPDATE bookings SET status = ? WHERE id = ?';
        let params = [status, req.params.id];
        if (status === 'cancelled') {
            query = 'UPDATE bookings SET status = ?, refundStatus = ? WHERE id = ?';
            params = [status, 'pending', req.params.id];
        }
        else {
            // Clear refund status if un-cancelled
            query = 'UPDATE bookings SET status = ?, refundStatus = NULL WHERE id = ?';
        }
        const result = yield db.run(query, params);
        if (result.changes === 0) {
            res.status(404).json({ message: "Booking not found" });
        }
        else {
            res.json({ message: `Booking marked as ${status}` });
        }
    }
    catch (err) {
        console.error("Update Booking Status Error:", err);
        res.status(500).json({ message: "Error updating booking status" });
    }
}));
router.put("/bookings/:id/refund", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const result = yield db.run('UPDATE bookings SET refundStatus = ? WHERE id = ? AND status = ?', ['processed', req.params.id, 'cancelled']);
        if (result.changes === 0) {
            res.status(404).json({ message: "Booking not found or not cancelled" });
        }
        else {
            res.json({ message: `Refund marked as processed` });
        }
    }
    catch (err) {
        console.error("Update Refund Status Error:", err);
        res.status(500).json({ message: "Error updating refund status" });
    }
}));
exports.default = router;
