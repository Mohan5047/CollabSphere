const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createTeamController,
    addTeamMemberController,
    getTeamMembersController
} = require("../controllers/teamController");

// Create Team
router.post("/", authMiddleware, createTeamController);

// Add Team Member
router.post("/add-member", authMiddleware, addTeamMemberController);

// Get Team Members
router.get("/:teamId/members", authMiddleware, getTeamMembersController);

module.exports = router;