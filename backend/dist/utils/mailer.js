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
exports.sendOtpEmail = exports.sendVerificationEmail = void 0;
const nodejs_1 = __importDefault(require("@emailjs/nodejs"));
/**
 * Sends a verification link using EmailJS to the newly registered user.
 *
 * If EmailJS credentials are not configured in the `.env` file, this
 * will safely log the link to the console for local development.
 */
const sendVerificationEmail = (toEmail, userName, token) => __awaiter(void 0, void 0, void 0, function* () {
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
    // Verification links expire in 24 hours
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    // Use FRONTEND_URL if available, otherwise fallback to localhost:3000
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/auth/verify-email?token=${token}`;
    if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
        console.warn("\n[EmailJS] Missing credentials. Simulating email send for local development.");
        console.warn(`[EmailJS] To: ${toEmail}`);
        console.warn(`[EmailJS] Link: ${verifyLink}\n`);
        return true;
    }
    try {
        yield nodejs_1.default.send(SERVICE_ID, TEMPLATE_ID, {
            email: toEmail,
            to_name: userName,
            link: verifyLink,
            time: expiryTime
        }, {
            publicKey: PUBLIC_KEY,
            privateKey: PRIVATE_KEY,
        });
        console.log(`[EmailJS] Verification email successfully sent to ${toEmail}`);
        return true;
    }
    catch (error) {
        console.error(`[EmailJS] Failed to send email to ${toEmail}:`, error);
        return false;
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
/**
 * Sends a one-time password (OTP) code to the given email using EmailJS.
 * Uses the EMAILJS_OTP_TEMPLATE_ID template, which should contain a {{otp}} variable.
 *
 * Falls back to logging the OTP to the console if credentials are not configured.
 */
const sendOtpEmail = (toEmail, userName, otp, expiresAt) => __awaiter(void 0, void 0, void 0, function* () {
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = process.env.EMAILJS_OTP_TEMPLATE_ID;
    if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
        const expiryFormatted = new Date(expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        console.warn("\n[EmailJS OTP] Missing credentials. Simulating OTP email send.");
        console.warn(`[EmailJS OTP] To: ${toEmail}`);
        console.warn(`[EmailJS OTP] OTP Code: ${otp} (expires ${expiryFormatted})\n`);
        return true;
    }
    try {
        yield nodejs_1.default.send(SERVICE_ID, TEMPLATE_ID, {
            email: toEmail,
            to_name: userName,
            passcode: otp,
            time: new Date(expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        }, {
            publicKey: PUBLIC_KEY,
            privateKey: PRIVATE_KEY,
        });
        console.log(`[EmailJS OTP] OTP email sent successfully to ${toEmail}`);
        return true;
    }
    catch (error) {
        console.error(`[EmailJS OTP] Failed to send OTP to ${toEmail}:`, error);
        return false;
    }
});
exports.sendOtpEmail = sendOtpEmail;
