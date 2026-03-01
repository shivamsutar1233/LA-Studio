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
        yield db.run('INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)', [userId, email, name, hashedPassword, userRole]);
        res.status(201).json({ message: "User registered successfully", userId });
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error during registration" });
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
