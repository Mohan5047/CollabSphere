const express = require("express");

const router = express.Router();

const {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");

router.post("/", createNotification);

router.get("/user/:userId", getUserNotifications);

router.put("/:notificationId/read", markAsRead);

router.put("/user/:userId/read-all", markAllAsRead);

router.delete("/:notificationId", deleteNotification);

module.exports = router;