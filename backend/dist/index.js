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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("./database");
const multer_1 = __importDefault(require("multer"));
const blob_1 = require("@vercel/blob");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
// Razorpay Instance
const razorpayInstance = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ==========================================
// SQLITE MIGRATION: In-memory arrays removed.
// ==========================================
// ==========================================
// MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.status(403).json({ message: "Invalid or expired token" });
            return;
        }
        req.user = user;
        next();
    });
};
const requireAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        res.status(403).json({ message: "Admin access required" });
        return;
    }
    next();
};
// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post("/api/auth/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield db.run('INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)', [userId, email, name, hashedPassword, userRole]);
        res.status(201).json({ message: "User registered successfully", userId });
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
}));
app.post("/api/auth/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: payload });
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
}));
app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
app.put("/api/users/me", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Sign new token to refresh payload claims
        const payload = { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name };
        const newToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: "Profile updated", user: updatedUser, token: newToken });
    }
    catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Server error updating profile" });
    }
}));
app.get("/api/users/me/addresses", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post("/api/users/me/addresses", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { street, city, state, zip, isDefault } = req.body;
        const db = yield (0, database_1.getDb)();
        const addressId = Math.random().toString(36).substr(2, 9);
        // If setting as default, unset others for this user
        if (isDefault) {
            yield db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', user.id);
        }
        // If it's the user's first address, force it to be default
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
// ==========================================
// GEAR ROUTES
// ==========================================
app.get("/api/gears", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const gearsData = yield db.all('SELECT * FROM gears');
        res.json(gearsData);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching gears" });
    }
}));
app.get("/api/gears/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const gear = yield db.get('SELECT * FROM gears WHERE id = ?', req.params.id);
        if (!gear) {
            res.status(404).json({ message: "Gear not found" });
        }
        else {
            res.json(gear);
        }
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching gear" });
    }
}));
// ==========================================
// BOOKING/RENTAL & ADMIN UPLOAD ROUTES
// ==========================================
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
app.post("/api/admin/upload", authenticateToken, requireAdmin, upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
// Create new gear (Admin only)
app.post("/api/gears", authenticateToken, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, pricePerDay, thumbnail, images } = req.body;
        const db = yield (0, database_1.getDb)();
        const newId = Math.random().toString(36).substr(2, 9);
        yield db.run('INSERT INTO gears (id, name, category, pricePerDay, thumbnail, images) VALUES (?, ?, ?, ?, ?, ?)', [newId, name, category, pricePerDay, thumbnail || '', images || '[]']);
        const newGear = yield db.get('SELECT * FROM gears WHERE id = ?', newId);
        res.status(201).json({ message: "Gear created successfully", gear: newGear });
    }
    catch (err) {
        console.error("Create Gear Error:", err);
        res.status(500).json({ message: "Error creating gear" });
    }
}));
// Update gear (Admin only)
app.put("/api/gears/:id", authenticateToken, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, pricePerDay, thumbnail, images } = req.body;
        const db = yield (0, database_1.getDb)();
        yield db.run('UPDATE gears SET name = ?, category = ?, pricePerDay = ?, thumbnail = ?, images = ? WHERE id = ?', [name, category, pricePerDay, thumbnail || '', images || '[]', req.params.id]);
        const updatedGear = yield db.get('SELECT * FROM gears WHERE id = ?', req.params.id);
        if (!updatedGear) {
            res.status(404).json({ message: "Gear not found" });
        }
        else {
            res.json({ message: "Gear updated successfully", gear: updatedGear });
        }
    }
    catch (err) {
        console.error("Update Gear Error:", err);
        res.status(500).json({ message: "Error updating gear" });
    }
}));
// Delete gear (Admin only)
app.delete("/api/gears/:id", authenticateToken, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const result = yield db.run('DELETE FROM gears WHERE id = ?', req.params.id);
        if (result.changes === 0) {
            res.status(404).json({ message: "Gear not found" });
        }
        else {
            res.json({ message: "Gear deleted successfully" });
        }
    }
    catch (err) {
        console.error("Delete Gear Error:", err);
        res.status(500).json({ message: "Error deleting gear" });
    }
}));
// Create booking
app.post("/api/rentals", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { gearId, startDate, endDate, customerDetails, cartItems, addressId } = req.body;
    const user = req.user;
    const userId = user.id;
    const createdAt = new Date().toISOString();
    const custName = (customerDetails === null || customerDetails === void 0 ? void 0 : customerDetails.name) || null;
    try {
        const db = yield (0, database_1.getDb)();
        const bookingId = Math.random().toString(36).substr(2, 9);
        let finalGearIds;
        if (cartItems && Array.isArray(cartItems)) {
            finalGearIds = JSON.stringify(cartItems);
        }
        else {
            const gearIdsArray = gearId ? gearId.split(',').map((id) => id.trim()) : [];
            finalGearIds = JSON.stringify(gearIdsArray);
        }
        yield db.run('INSERT INTO bookings (id, userId, gearIds, startDate, endDate, status, customerName, createdAt, addressId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [bookingId, userId, finalGearIds, startDate, endDate, 'pending', custName, createdAt, addressId || null]);
        res.status(201).json({
            message: "Rental booked successfully",
            rental: { id: bookingId, userId, gearIds: finalGearIds, startDate, endDate, status: "pending", addressId },
        });
    }
    catch (err) {
        console.error("Booking Error:", err);
        res.status(500).json({ message: "Error mapping booking" });
    }
}));
// Get bookings for current user
app.get("/api/bookings", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        const db = yield (0, database_1.getDb)();
        const userBookings = yield db.all('SELECT * FROM bookings WHERE userId = ?', user.id);
        res.json(userBookings);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching bookings" });
    }
}));
// Get ALL bookings (Admin only)
app.get("/api/admin/bookings", authenticateToken, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        // Use a LEFT JOIN to fetch addresses linked to bookings
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
        const allUsers = yield db.all('SELECT id, email, name, role FROM users'); // Excluding password
        // Map the flat row back to nested structure
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
// Update booking status (Admin only)
app.put("/api/admin/bookings/:id/status", authenticateToken, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        if (!['pending', 'confirmed', 'rejected'].includes(status)) {
            res.status(400).json({ message: "Invalid status" });
            return;
        }
        const db = yield (0, database_1.getDb)();
        const result = yield db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
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
// ==========================================
// RAZORPAY PAYMENT ROUTES
// ==========================================
// Create a Razorpay Order
app.post("/api/payment/create-order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const order = yield razorpayInstance.orders.create(options);
        res.status(200).json(order);
    }
    catch (error) {
        console.error("Razorpay Create Order Error:", error);
        res.status(500).json({ message: "Error creating Razorpay Order" });
    }
}));
// Verify a Razorpay Signature
app.post("/api/payment/verify", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            // Signature verified successfully
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
// Initialize DB and start server
(0, database_1.initDb)().then(() => {
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port} with SQLite DB`);
    });
}).catch(err => {
    console.error("Failed to initialize database", err);
    process.exit(1);
});
