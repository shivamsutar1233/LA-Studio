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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/rentals", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { gearId, startDate, endDate, customerDetails, cartItems, addressId } = req.body;
    const user = req.user;
    const userId = user.id;
    const createdAt = new Date().toISOString();
    const custName = (customerDetails === null || customerDetails === void 0 ? void 0 : customerDetails.name) || null;
    try {
        const db = yield (0, database_1.getDb)();
        // Validate overlapping dates for all gear items
        let itemsToValidate = [];
        if (cartItems && Array.isArray(cartItems)) {
            itemsToValidate = cartItems;
        }
        else if (gearId && startDate && endDate) {
            const gearIdsArray = gearId.split(',').map((id) => id.trim());
            itemsToValidate = gearIdsArray.map((id) => ({ id, startDate, endDate }));
        }
        for (const item of itemsToValidate) {
            if (!item.id || !item.startDate || !item.endDate)
                continue;
            const overlappingBookings = yield db.all(`
        SELECT startDate, endDate 
        FROM bookings 
        WHERE status IN ('confirmed', 'pending') 
          AND (gearIds LIKE ? OR gearIds LIKE ? OR gearIds LIKE ? OR gearIds = ?)
          AND (
            (startDate <= ? AND endDate >= ?) OR
            (startDate >= ? AND startDate <= ?)
          )
      `, [
                `%,"${item.id}",%`, `["${item.id}",%`, `%,"${item.id}"]`, `["${item.id}"]`,
                item.endDate, item.startDate,
                item.startDate, item.endDate
            ]);
            if (overlappingBookings.length > 0) {
                res.status(400).json({
                    message: "One or more gears are already booked for the selected dates",
                    gearId: item.id
                });
                return;
            }
        }
        const bookingId = Math.random().toString(36).substr(2, 9);
        let finalGearIds;
        if (cartItems && Array.isArray(cartItems)) {
            finalGearIds = JSON.stringify(cartItems.map((item) => item.id || item.gearId));
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
router.post("/validate-cart", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cartItems } = req.body;
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        res.json({ valid: true });
        return;
    }
    try {
        const db = yield (0, database_1.getDb)();
        const unavailableItems = [];
        for (const item of cartItems) {
            const id = item.id || item.gearId;
            if (!id || !item.startDate || !item.endDate)
                continue;
            const overlappingBookings = yield db.all(`
        SELECT startDate, endDate 
        FROM bookings 
        WHERE status IN ('confirmed', 'pending') 
          AND (gearIds LIKE ? OR gearIds LIKE ? OR gearIds LIKE ? OR gearIds = ?)
          AND (
            (startDate <= ? AND endDate >= ?) OR
            (startDate >= ? AND startDate <= ?)
          )
      `, [
                `%,"${id}",%`, `["${id}",%`, `%,"${id}"]`, `["${id}"]`,
                item.endDate, item.startDate,
                item.startDate, item.endDate
            ]);
            if (overlappingBookings.length > 0) {
                unavailableItems.push({
                    id,
                    name: item.name,
                    startDate: item.startDate,
                    endDate: item.endDate
                });
            }
        }
        if (unavailableItems.length > 0) {
            res.status(400).json({
                valid: false,
                message: "Some items are not available for the selected dates.",
                unavailableItems
            });
        }
        else {
            res.json({ valid: true });
        }
    }
    catch (err) {
        console.error("Validation Error:", err);
        res.status(500).json({ message: "Error validating cart dates" });
    }
}));
router.get("/bookings", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        const db = yield (0, database_1.getDb)();
        const userBookings = yield db.all('SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC', user.id);
        res.json(userBookings);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching bookings" });
    }
}));
router.put("/bookings/:id/cancel", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const bookingId = req.params.id;
    try {
        const db = yield (0, database_1.getDb)();
        const booking = yield db.get('SELECT * FROM bookings WHERE id = ? AND userId = ?', [bookingId, user.id]);
        if (!booking) {
            res.status(404).json({ message: "Booking not found" });
            return;
        }
        if (booking.status === 'cancelled' || booking.status === 'rejected') {
            res.status(400).json({ message: `Booking cannot be cancelled because it is already ${booking.status}` });
            return;
        }
        yield db.run('UPDATE bookings SET status = ?, refundStatus = ? WHERE id = ?', ['cancelled', 'pending', bookingId]);
        res.json({ message: "Booking cancelled successfully" });
    }
    catch (err) {
        console.error("Cancel Booking Error:", err);
        res.status(500).json({ message: "Error cancelling booking" });
    }
}));
router.post("/bookings/:id/aadhaar/generate-otp", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { aadhaarNumber } = req.body;
        const user = req.user;
        const bookingId = req.params.id;
        if (!aadhaarNumber || aadhaarNumber.length !== 12) {
            res.status(400).json({ message: "Valid 12-digit Aadhaar number is required" });
            return;
        }
        const db = yield (0, database_1.getDb)();
        const booking = yield db.get('SELECT * FROM bookings WHERE id = ? AND userId = ?', [bookingId, user.id]);
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
        const response = yield fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
            body: JSON.stringify({ id_number: aadhaarNumber })
        });
        const data = yield response.json();
        if (response.ok && data.status_code === 200 && ((_a = data.data) === null || _a === void 0 ? void 0 : _a.client_id)) {
            res.json({ clientId: data.data.client_id, message: "OTP Sent Successfully" });
        }
        else {
            res.status(400).json({ message: data.message || "Failed to generate OTP from Aadhaar authority" });
        }
    }
    catch (err) {
        console.error("Generate OTP Error:", err);
        res.status(500).json({ message: "Server error generating OTP" });
    }
}));
router.post("/bookings/:id/aadhaar/submit-otp", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { clientId, otp, aadhaarNumber, aadhaarUrl } = req.body;
        const user = req.user;
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
            if (!aadhaarDetailsUrl)
                aadhaarDetailsUrl = "https://example.com/mock_kyc_document.pdf";
        }
        else {
            const response = yield fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
                body: JSON.stringify({ client_id: clientId, otp })
            });
            const data = yield response.json();
            if (response.ok && data.status_code === 200) {
                if (!aadhaarDetailsUrl)
                    aadhaarDetailsUrl = ((_a = data.data) === null || _a === void 0 ? void 0 : _a.profile_image) || "verified_via_api";
            }
            else {
                res.status(400).json({ message: data.message || "Invalid OTP or Verification Failed" });
                return;
            }
        }
        const db = yield (0, database_1.getDb)();
        yield db.run('UPDATE bookings SET undertakingSigned = 1, aadhaarNumber = ?, aadhaarUrl = ? WHERE id = ?', [aadhaarNumber, aadhaarDetailsUrl, bookingId]);
        res.json({ message: "Undertaking signed and Aadhaar verified successfully!" });
    }
    catch (err) {
        console.error("Submit OTP Error:", err);
        res.status(500).json({ message: "Server error verifying OTP" });
    }
}));
exports.default = router;
