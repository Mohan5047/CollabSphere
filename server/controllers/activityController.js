const pool = require("../config/db");

// ==========================================
// HELPER: CHECK TEAM ACCESS
// ==========================================
const checkTeamAccess = async (teamId, userId) => {
    const result = await pool.query(
        `SELECT t.id
         FROM teams t
         INNER JOIN projects p ON t.project_id = p.id
         WHERE t.id = $1
         AND (
             p.owner_id = $2
             OR EXISTS (
                 SELECT 1 FROM team_members tm
                 WHERE tm.team_id = t.id AND tm.user_id = $2
             )
         )`,
        [teamId, userId]
    );
    return result.rows.length > 0;
};

// ==========================================
// HELPER: CHECK PROJECT ACCESS
// ==========================================
const checkProjectAccess = async (projectId, userId) => {
    const result = await pool.query(
        `SELECT p.id
         FROM projects p
         WHERE p.id = $1
         AND (
             p.owner_id = $2
             OR EXISTS (
                 SELECT 1 FROM teams t
                 INNER JOIN team_members tm ON tm.team_id = t.id
                 WHERE t.project_id = p.id AND tm.user_id = $2
             )
         )`,
        [projectId, userId]
    );
    return result.rows.length > 0;
};

// ==========================================
// GET USER ACTIVITIES
// ==========================================
const getUserActivities = async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = Number(req.user.id);
        const targetUserId = Number(userId);

        if (!targetUserId || isNaN(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        // Only the user themselves or an admin can view their personal activities
        const userRole = (req.user.role || "").toLowerCase();
        if (loggedInUserId !== targetUserId && userRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this user's activities"
            });
        }

        const result = await pool.query(
            `SELECT
                a.id,
                a.user_id,
                a.team_id,
                a.project_id,
                a.activity_type,
                a.description,
                a.created_at,
                u.full_name AS user_name,
                u.email AS user_email
             FROM activities a
             INNER JOIN users u ON a.user_id = u.id
             WHERE a.user_id = $1
             ORDER BY a.created_at DESC`,
            [targetUserId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("GET USER ACTIVITIES ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// ==========================================
// GET TEAM ACTIVITIES
// ==========================================
const getTeamActivities = async (req, res) => {
    try {
        const { teamId } = req.params;
        const loggedInUserId = Number(req.user.id);
        const numericTeamId = Number(teamId);

        if (!numericTeamId || isNaN(numericTeamId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid team ID"
            });
        }

        // Verify team exists
        const teamCheck = await pool.query(
            "SELECT id FROM teams WHERE id = $1",
            [numericTeamId]
        );

        if (teamCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        // Check access
        const hasAccess = await checkTeamAccess(numericTeamId, loggedInUserId);
        const userRole = (req.user.role || "").toLowerCase();

        if (!hasAccess && userRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this team's activities"
            });
        }

        const result = await pool.query(
            `SELECT
                a.id,
                a.user_id,
                a.team_id,
                a.project_id,
                a.activity_type,
                a.description,
                a.created_at,
                u.full_name AS user_name,
                u.email AS user_email
             FROM activities a
             INNER JOIN users u ON a.user_id = u.id
             WHERE a.team_id = $1
             ORDER BY a.created_at DESC`,
            [numericTeamId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("GET TEAM ACTIVITIES ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// ==========================================
// GET PROJECT ACTIVITIES
// ==========================================
const getProjectActivities = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUserId = Number(req.user.id);
        const numericProjectId = Number(projectId);

        if (!numericProjectId || isNaN(numericProjectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID"
            });
        }

        // Verify project exists
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1",
            [numericProjectId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Check access
        const hasAccess = await checkProjectAccess(numericProjectId, loggedInUserId);
        const userRole = (req.user.role || "").toLowerCase();

        if (!hasAccess && userRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project's activities"
            });
        }

        const result = await pool.query(
            `SELECT
                a.id,
                a.user_id,
                a.team_id,
                a.project_id,
                a.activity_type,
                a.description,
                a.created_at,
                u.full_name AS user_name,
                u.email AS user_email
             FROM activities a
             INNER JOIN users u ON a.user_id = u.id
             WHERE a.project_id = $1
                OR a.team_id IN (SELECT id FROM teams WHERE project_id = $1)
             ORDER BY a.created_at DESC`,
            [numericProjectId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error("GET PROJECT ACTIVITIES ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

module.exports = {
    getUserActivities,
    getTeamActivities,
    getProjectActivities
};
