const nodemailer = require("nodemailer");

/**
 * Creates an email transporter using environment configuration.
 * If credentials are not configured, returns null to allow safe simulation.
 */
const getTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

/**
 * Send an email safely. If no credentials are configured, logs simulation.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!to || !subject) {
            return {
                success: false,
                message: "Recipient ('to') and 'subject' are required"
            };
        }

        const transporter = getTransporter();

        if (!transporter) {
            console.log(
                `📨 [EMAIL SIMULATED (No credentials in .env)]\n` +
                `   To: ${to}\n` +
                `   Subject: ${subject}\n` +
                `   Message: ${text || html}`
            );
            return {
                success: true,
                simulated: true,
                message: "Email simulated (configure EMAIL_USER and EMAIL_PASSWORD in .env for live delivery)"
            };
        }

        const info = await transporter.sendMail({
            from: `"CollabSphere" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text
        });

        console.log(`✅ [EMAIL SENT] MessageId: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error("❌ [EMAIL SEND ERROR]:", error.message);
        return {
            success: false,
            message: error.message
        };
    }
};

module.exports = {
    sendEmail
};
