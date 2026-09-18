const pool = require("../config/db");
const { sendEmail } = require("../utils/emailService");

// ==========================================
// CREATE NOTIFICATION
// ==========================================

const createNotification = async (req, res) => {
    try {
        const {
            user_id,
            title,
            message,
            type
        } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({
                success: false,
                message:
                    "user_id, title and message are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO notifications
            (user_id, title, message, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                user_id,
                title.trim(),
                message.trim(),
                type || "INFO"
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Notification created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "CREATE NOTIFICATION ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// GET USER NOTIFICATIONS
// ==========================================

const getUserNotifications = async (
    req,
    res
) => {
    try {
        const { userId } = req.params;

        const loggedInUserId =
            Number(req.user.id);

        // User can only access their own notifications
        if (
            Number(userId) !==
            loggedInUserId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only view your own notifications"
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "GET NOTIFICATIONS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// MARK ONE NOTIFICATION AS READ
// ==========================================

const markAsRead = async (
    req,
    res
) => {
    try {
        const { notificationId } =
            req.params;

        const userId =
            Number(req.user.id);

        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = $1
             AND user_id = $2
             RETURNING *`,
            [
                notificationId,
                userId
            ]
        );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Notification marked as read",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "MARK READ ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// MARK ALL AS READ
// ==========================================

const markAllAsRead = async (
    req,
    res
) => {
    try {
        const { userId } =
            req.params;

        const loggedInUserId =
            Number(req.user.id);

        if (
            Number(userId) !==
            loggedInUserId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only update your own notifications"
            });
        }

        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = $1
             AND is_read = FALSE`,
            [userId]
        );

        res.status(200).json({
            success: true,
            message:
                "All notifications marked as read",
            updated: result.rowCount
        });

    } catch (error) {
        console.error(
            "MARK ALL READ ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// DELETE NOTIFICATION
// ==========================================

const deleteNotification = async (
    req,
    res
) => {
    try {
        const { notificationId } =
            req.params;

        const userId =
            Number(req.user.id);

        const result = await pool.query(
            `DELETE FROM notifications
             WHERE id = $1
             AND user_id = $2
             RETURNING *`,
            [
                notificationId,
                userId
            ]
        );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Notification deleted successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "DELETE NOTIFICATION ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// TEST EMAIL NOTIFICATION
// ==========================================

const sendTestEmail = async (req, res) => {
    try {
        const { to, subject, message } = req.body || {};
        const targetEmail = to || req.user.email;

        if (!targetEmail) {
            return res.status(400).json({
                success: false,
                message: "Recipient email is required"
            });
        }

        const emailResult = await sendEmail({
            to: targetEmail,
            subject: subject || "CollabSphere Notification",
            text: message || "Hello! This is a test email notification from CollabSphere.",
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #4F46E5;">CollabSphere Notification</h2>
                <p>${message || "Hello! This is a test email notification from CollabSphere."}</p>
                <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
                <p style="color: #6B7280; font-size: 12px;">Sent from CollabSphere Platform</p>
            </div>`
        });

        res.status(200).json({
            success: true,
            message: emailResult.simulated
                ? "Email notification simulated successfully"
                : "Email notification sent successfully",
            data: emailResult
        });
    } catch (error) {
        console.error("TEST EMAIL ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestEmail
};