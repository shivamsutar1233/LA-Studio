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
        const bundlesData = yield db.all(`
          SELECT b.*, 
                 COALESCE(AVG(r.rating), 0) as averageRating, 
                 COUNT(r.id) as reviewCount
          FROM bundles b
          LEFT JOIN reviews r ON b.id = r.targetId AND r.targetType = 'bundle'
          GROUP BY b.id
        `);
        res.json(bundlesData);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching bundles" });
    }
}));
router.get("/featured", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        // Fetch top 3 most premium bundles based on pricePerDay
        const featuredBundles = yield db.all(`
          SELECT b.*, 
                 COALESCE(AVG(r.rating), 0) as averageRating, 
                 COUNT(r.id) as reviewCount
          FROM bundles b
          LEFT JOIN reviews r ON b.id = r.targetId AND r.targetType = 'bundle'
          GROUP BY b.id
          ORDER BY pricePerDay DESC 
          LIMIT 3
        `);
        res.json(featuredBundles);
    }
    catch (err) {
        console.error("Error fetching featured bundles:", err);
        res.status(500).json({ message: "Error fetching featured bundles" });
    }
}));
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const bundle = yield db.get(`
          SELECT b.*, 
                 COALESCE(AVG(r.rating), 0) as averageRating, 
                 COUNT(r.id) as reviewCount
          FROM bundles b
          LEFT JOIN reviews r ON b.id = r.targetId AND r.targetType = 'bundle'
          WHERE b.id = ?
          GROUP BY b.id
        `, req.params.id);
        if (!bundle) {
            res.status(404).json({ message: "Bundle not found" });
        }
        else {
            res.json(bundle);
        }
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching bundle" });
    }
}));
router.get("/:id/booked-dates", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const bundle = yield db.get('SELECT gearIds FROM bundles WHERE id = ?', req.params.id);
        if (!bundle) {
            res.status(404).json({ message: "Bundle not found" });
            return;
        }
        const gearIds = JSON.parse(bundle.gearIds || '[]');
        if (gearIds.length === 0) {
            res.json([]);
            return;
        }
        const likeClauses = gearIds.map((id) => `gearIds LIKE '%,"${id}",%' OR gearIds LIKE '["${id}",%' OR gearIds LIKE '%,"${id}"]' OR gearIds = '["${id}"]'`).join(' OR ');
        const bookings = yield db.all(`
      SELECT startDate, endDate FROM bookings 
      WHERE status IN ('confirmed', 'pending') 
        AND (${likeClauses})
    `);
        res.json(bookings);
    }
    catch (err) {
        console.error("Bundle Booked Dates Error:", err);
        res.status(500).json({ message: "Error fetching booked dates for bundle" });
    }
}));
router.post("/", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, pricePerDay, thumbnail, images, gearIds } = req.body;
        const db = yield (0, database_1.getDb)();
        const newId = Math.random().toString(36).substr(2, 9);
        yield db.run('INSERT INTO bundles (id, name, description, pricePerDay, thumbnail, images, gearIds) VALUES (?, ?, ?, ?, ?, ?, ?)', [newId, name, description, pricePerDay, thumbnail || '', images || '[]', gearIds || '[]']);
        const newBundle = yield db.get('SELECT * FROM bundles WHERE id = ?', newId);
        res.status(201).json({ message: "Bundle created successfully", bundle: newBundle });
    }
    catch (err) {
        console.error("Create Bundle Error:", err);
        res.status(500).json({ message: "Error creating bundle" });
    }
}));
router.put("/:id", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, pricePerDay, thumbnail, images, gearIds } = req.body;
        const db = yield (0, database_1.getDb)();
        yield db.run('UPDATE bundles SET name = ?, description = ?, pricePerDay = ?, thumbnail = ?, images = ?, gearIds = ? WHERE id = ?', [name, description, pricePerDay, thumbnail || '', images || '[]', gearIds || '[]', req.params.id]);
        const updatedBundle = yield db.get('SELECT * FROM bundles WHERE id = ?', req.params.id);
        if (!updatedBundle) {
            res.status(404).json({ message: "Bundle not found" });
        }
        else {
            res.json({ message: "Bundle updated successfully", bundle: updatedBundle });
        }
    }
    catch (err) {
        console.error("Update Bundle Error:", err);
        res.status(500).json({ message: "Error updating bundle" });
    }
}));
router.delete("/:id", authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const result = yield db.run('DELETE FROM bundles WHERE id = ?', req.params.id);
        if (result.changes === 0) {
            res.status(404).json({ message: "Bundle not found" });
        }
        else {
            res.json({ message: "Bundle deleted successfully" });
        }
    }
    catch (err) {
        console.error("Delete Bundle Error:", err);
        res.status(500).json({ message: "Error deleting bundle" });
    }
}));
exports.default = router;
