 const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    getUserDashboard
} = require("../controllers/dashboardController");

// Get logged-in user's dashboard
router.get(
    "/user/:userId",
    authMiddleware,
    getUserDashboard
);

module.exports = router;