const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { aiChat } = require("../controllers/aiController");

// AI chat endpoint
router.post(
    "/chat",
    authMiddleware,
    aiChat
);

module.exports = router;
