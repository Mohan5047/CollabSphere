const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getUserActivities,
    getTeamActivities,
    getProjectActivities
} = require("../controllers/activityController");

// User activities
router.get(
    "/user/:userId",
    authMiddleware,
    getUserActivities
);

// Team activities
router.get(
    "/team/:teamId",
    authMiddleware,
    getTeamActivities
);

// Project activities
router.get(
    "/project/:projectId",
    authMiddleware,
    getProjectActivities
);

module.exports = router;
