const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");

// Create notification
router.post(
    "/",
    authMiddleware,
    createNotification
);

// Get user notifications
router.get(
    "/user/:userId",
    authMiddleware,
    getUserNotifications
);

// Mark one as read
router.put(
    "/:notificationId/read",
    authMiddleware,
    markAsRead
);

// Mark all as read
router.put(
    "/user/:userId/read-all",
    authMiddleware,
    markAllAsRead
);

// Delete notification
router.delete(
    "/:notificationId",
    authMiddleware,
    deleteNotification
);

module.exports = router;