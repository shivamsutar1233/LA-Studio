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
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../database");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// GET reviews for a specific target (gear or bundle)
router.get('/:targetId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield (0, database_1.getDb)();
        const reviews = yield db.all(`SELECT r.*, u.name as userName 
       FROM reviews r 
       JOIN users u ON r.userId = u.id 
       WHERE r.targetId = ? 
       ORDER BY r.createdAt DESC`, [req.params.targetId]);
        res.json(reviews);
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
}));
// POST a new review
router.post('/', authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetId, targetType, rating, comment } = req.body;
        const userId = req.user.id;
        if (!targetId || !targetType || !rating) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const db = yield (0, database_1.getDb)();
        // Check if user already reviewed this item
        const existingReview = yield db.get('SELECT id FROM reviews WHERE userId = ? AND targetId = ?', [userId, targetId]);
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }
        const id = crypto_1.default.randomUUID();
        const createdAt = new Date().toISOString();
        yield db.run('INSERT INTO reviews (id, userId, targetId, targetType, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, targetId, targetType, rating, comment, createdAt]);
        const newReview = yield db.get('SELECT r.*, u.name as userName FROM reviews r JOIN users u ON r.userId = u.id WHERE r.id = ?', [id]);
        res.status(201).json(newReview);
    }
    catch (error) {
        console.error('Error posting review:', error);
        res.status(500).json({ error: 'Failed to post review' });
    }
}));
exports.default = router;
