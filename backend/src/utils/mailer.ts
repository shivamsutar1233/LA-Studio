import emailjs from '@emailjs/nodejs';

/**
 * Sends a verification link using EmailJS to the newly registered user.
 * 
 * If EmailJS credentials are not configured in the `.env` file, this
 * will safely log the link to the console for local development.
 */
export const sendVerificationEmail = async (toEmail: string, userName: string, token: string) => {
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;

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
        await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
                email: toEmail,
                to_name: userName,
                link: verifyLink
            },
            {
                publicKey: PUBLIC_KEY,
                privateKey: PRIVATE_KEY,
            }
        );
        console.log(`[EmailJS] Verification email successfully sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error(`[EmailJS] Failed to send email to ${toEmail}:`, error);
        return false;
    }
};
