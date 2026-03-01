"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const gears_1 = __importDefault(require("./routes/gears"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const admin_1 = __importDefault(require("./routes/admin"));
const payment_1 = __importDefault(require("./routes/payment"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000"
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        // For strictly browser-only frontend, you can remove the !origin check
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
// ==========================================
// REGISTER ROUTES
// ==========================================
app.use("/api/auth", auth_1.default);
app.use("/api", users_1.default);
app.use("/api/gears", gears_1.default);
app.use("/api", bookings_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/payment", payment_1.default);
// Initialize DB and start server
(0, database_1.initDb)().then(() => {
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port} with SQLite DB`);
    });
}).catch(err => {
    console.error("Failed to initialize database", err);
    process.exit(1);
});
