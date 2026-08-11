const pool = require("../config/db");

// =========================
// Create Team Controller
// =========================
const createTeamController = async (req, res) => {
    try {

        // Get data from request body
        const { project_id, team_name } = req.body;

        // Validation
        if (!project_id || !team_name) {
            return res.status(400).json({
                success: false,
                message: "Project ID and Team Name are required"
            });
        }

        // Check if project exists
        const project = await pool.query(
            "SELECT * FROM projects WHERE id = $1",
            [project_id]
        );

        if (project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Check if logged-in user owns the project
        if (project.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to create a team for this project"
            });
        }

        // Create Team
        const team = await pool.query(
            `INSERT INTO teams (project_id, team_name)
             VALUES ($1, $2)
             RETURNING *`,
            [project_id, team_name]
        );

        res.status(201).json({
            success: true,
            message: "Team Created Successfully",
            team: team.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
// =========================
// Add Team Member Controller
// =========================
const addTeamMemberController = async (req, res) => {
    try {

        const { team_id, user_id } = req.body;

        // Validation
        if (!team_id || !user_id) {
            return res.status(400).json({
                success: false,
                message: "Team ID and User ID are required"
            });
        }

        // Check if team exists
        const team = await pool.query(
            "SELECT * FROM teams WHERE id = $1",
            [team_id]
        );

        if (team.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        // Check if user exists
        const user = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [user_id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if member already exists
        const existingMember = await pool.query(
            `SELECT * FROM team_members
             WHERE team_id = $1 AND user_id = $2`,
            [team_id, user_id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User is already a team member"
            });
        }

        // Add member
        const member = await pool.query(
            `INSERT INTO team_members (team_id, user_id)
             VALUES ($1, $2)
             RETURNING *`,
            [team_id, user_id]
        );

        res.status(201).json({
            success: true,
            message: "Team Member Added Successfully",
            member: member.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
// =========================
// Get Team Members Controller
// =========================
const getTeamMembersController = async (req, res) => {
    try {

        const { teamId } = req.params;

        const members = await pool.query(
            `SELECT
                users.id,
                users.full_name,
                users.email,
                users.role
             FROM team_members
             INNER JOIN users
             ON team_members.user_id = users.id
             WHERE team_members.team_id = $1`,
            [teamId]
        );

        res.status(200).json({
            success: true,
            totalMembers: members.rows.length,
            members: members.rows
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
module.exports = {
    createTeamController,
    addTeamMemberController,
    getTeamMembersController
};