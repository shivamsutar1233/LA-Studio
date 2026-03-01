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
    "http://localhost:3000",
    "https://leananglestudio.shop",
    "https://www.leananglestudio.shop",
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if the origin is in our allowed list or if it's a localhost origin
        if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked request from origin: ${origin}`);
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
