const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    dashboardController
} = require("../controllers/dashboardController");

// Dashboard
router.get("/", authMiddleware, dashboardController);

module.exports = router;