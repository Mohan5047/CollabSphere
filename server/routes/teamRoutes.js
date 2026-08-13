 const express = require("express");

const router = express.Router();

const {
    createTeam,
    getAllTeams,
    getTeamById,
    addTeamMember,
    removeTeamMember
} = require("../controllers/teamController");


// Create team
router.post("/", createTeam);


// Get all teams
router.get("/", getAllTeams);


// Add member
router.post("/members", addTeamMember);


// Remove member
router.delete(
    "/:teamId/members/:userId",
    removeTeamMember
);


// Get team with members
router.get("/:teamId", getTeamById);


module.exports = router;