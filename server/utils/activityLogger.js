const pool = require("../config/db");

/**
 * Log an activity to the database safely (non-blocking).
 * @param {Object} params
 * @param {number} params.userId - User who performed the action
 * @param {string} params.activityType - Short identifier (e.g. 'PROJECT_CREATED', 'TASK_COMPLETED')
 * @param {string} params.description - Human-readable description
 * @param {number|null} [params.teamId] - Associated team ID (optional)
 * @param {number|null} [params.projectId] - Associated project ID (optional)
 */
const logActivity = async ({ userId, activityType, description, teamId = null, projectId = null }) => {
    try {
        if (!userId || !activityType || !description) {
            return null;
        }

        const result = await pool.query(
            `INSERT INTO activities (user_id, activity_type, description, team_id, project_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [Number(userId), activityType, description, teamId ? Number(teamId) : null, projectId ? Number(projectId) : null]
        );

        return result.rows[0];
    } catch (error) {
        console.error("⚠️ LOG ACTIVITY ERROR (Non-blocking):", error.message);
        return null;
    }
};

module.exports = { logActivity };
