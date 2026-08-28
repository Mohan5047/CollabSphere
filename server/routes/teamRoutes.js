 const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    createTeam,
    getAllTeams,
    getTeamById,
    addTeamMember,
    removeTeamMember,
    assignTeamLead
} = require("../controllers/teamController");

// ==========================================
// CREATE TEAM
// ==========================================

router.post(
    "/",
    authMiddleware,
    createTeam
);

// ==========================================
// GET ALL TEAMS
// ==========================================

router.get(
    "/",
    authMiddleware,
    getAllTeams
);

// ==========================================
// ADD MEMBER
// ==========================================

router.post(
    "/members",
    authMiddleware,
    addTeamMember
);

// ==========================================
// REMOVE MEMBER
// ==========================================

router.delete(
    "/:teamId/members/:userId",
    authMiddleware,
    removeTeamMember
);

// ==========================================
// ASSIGN TEAM LEAD
// ==========================================

router.put(
    "/:teamId/lead/:userId",
    authMiddleware,
    assignTeamLead
);

// ==========================================
// GET TEAM
// ==========================================

router.get(
    "/:teamId",
    authMiddleware,
    getTeamById
);

module.exports = router;