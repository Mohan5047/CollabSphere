 const pool = require("../config/db");

// ==========================================
// CREATE TEAM
// ==========================================

const createTeam = async (req, res) => {
    try {
        const { project_id, team_name } = req.body;

        if (!project_id || !team_name) {
            return res.status(400).json({
                success: false,
                message: "project_id and team_name are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO teams
            (project_id, team_name)
            VALUES ($1, $2)
            RETURNING *`,
            [project_id, team_name]
        );

        res.status(201).json({
            success: true,
            message: "Team created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE TEAM ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET ALL TEAMS
// ==========================================

const getAllTeams = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.id,
                t.project_id,
                t.team_name,
                t.created_at,
                COUNT(tm.id) AS member_count
            FROM teams t
            LEFT JOIN team_members tm
                ON t.id = tm.team_id
            GROUP BY
                t.id,
                t.project_id,
                t.team_name,
                t.created_at
            ORDER BY t.created_at DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("GET TEAMS ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ==========================================
// ASSIGN TEAM LEAD
// ==========================================

const assignTeamLead = async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        // Check whether the user is already a team member
        const memberResult = await pool.query(
            `SELECT *
             FROM team_members
             WHERE team_id = $1
             AND user_id = $2`,
            [teamId, userId]
        );

        if (memberResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User is not a member of this team"
            });
        }

        // Remove existing team lead
        await pool.query(
            `UPDATE team_members
             SET role = 'member'
             WHERE team_id = $1
             AND role = 'team_lead'`,
            [teamId]
        );

        // Assign new team lead
        const result = await pool.query(
            `UPDATE team_members
             SET role = 'team_lead'
             WHERE team_id = $1
             AND user_id = $2
             RETURNING *`,
            [teamId, userId]
        );

        res.status(200).json({
            success: true,
            message: "Team lead assigned successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("ASSIGN TEAM LEAD ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GET TEAM BY ID
// ==========================================

const getTeamById = async (req, res) => {
    try {
        const { teamId } = req.params;

        const teamResult = await pool.query(
            `SELECT *
             FROM teams
             WHERE id = $1`,
            [teamId]
        );

        if (teamResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        const membersResult = await pool.query(`
            SELECT
    tm.id AS member_id,
    tm.user_id,
    u.full_name,
    u.email,
    tm.role,
    tm.joined_at
            FROM team_members tm
            JOIN users u
                ON tm.user_id = u.id
            WHERE tm.team_id = $1
            ORDER BY tm.joined_at ASC
        `, [teamId]);

        res.status(200).json({
            success: true,
            data: {
                team: teamResult.rows[0],
                members: membersResult.rows
            }
        });

    } catch (error) {
        console.error("GET TEAM ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ADD MEMBER TO TEAM
// ==========================================

const addTeamMember = async (req, res) => {
    try {
        const { team_id, user_id } = req.body;

        if (!team_id || !user_id) {
            return res.status(400).json({
                success: false,
                message: "team_id and user_id are required"
            });
        }

        // Check team
        const teamResult = await pool.query(
            `SELECT id
             FROM teams
             WHERE id = $1`,
            [team_id]
        );

        if (teamResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        // Check user
        const userResult = await pool.query(
            `SELECT id, full_name, email
             FROM users
             WHERE id = $1`,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check duplicate membership
        const existingMember = await pool.query(
            `SELECT id
             FROM team_members
             WHERE team_id = $1
             AND user_id = $2`,
            [team_id, user_id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User is already a member of this team"
            });
        }

        const result = await pool.query(
            `INSERT INTO team_members
            (team_id, user_id)
            VALUES ($1, $2)
            RETURNING *`,
            [team_id, user_id]
        );

        res.status(201).json({
            success: true,
            message: "Member added successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("ADD TEAM MEMBER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// REMOVE MEMBER FROM TEAM
// ==========================================

const removeTeamMember = async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        const result = await pool.query(
            `DELETE FROM team_members
             WHERE team_id = $1
             AND user_id = $2
             RETURNING *`,
            [teamId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team member not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Member removed successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("REMOVE TEAM MEMBER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createTeam,
    getAllTeams,
    getTeamById,
    addTeamMember,
    removeTeamMember,
    assignTeamLead
};