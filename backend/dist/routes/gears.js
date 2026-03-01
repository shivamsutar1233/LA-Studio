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
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const gearsData = yield db.all('SELECT * FROM gears');
        res.json(gearsData);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching gears" });
    }
}));
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/:id/booked-dates", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        // Find all bookings that contain this gearId and are either confirmed or pending
        // We check if the gearIds JSON array contains the specific ID
        const bookings = yield db.all(`
      SELECT startDate, endDate 
      FROM bookings 
      WHERE status IN ('confirmed', 'pending') 
        AND (gearIds LIKE ? OR gearIds LIKE ? OR gearIds LIKE ? OR gearIds = ?)
    `, [
            `%,"${req.params.id}",%`, // Middle of array
            `["${req.params.id}",%`, // Start of array
            `%,"${req.params.id}"]`, // End of array
            `["${req.params.id}"]` // Only element in array
        ]);
        res.json(bookings);
    }
    catch (err) {
        console.error("Error fetching booked dates:", err);
        res.status(500).json({ message: "Error fetching booked dates for gear" });
    }
}));
router.post("/", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.put("/:id", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.delete("/:id", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.default = router;
