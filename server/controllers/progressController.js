const pool = require("../config/db");

// GET all progress
const getAllProgress = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                lp.id,
                lp.user_id,
                lp.lesson_id,
                lp.status,
                lp.progress_percent,
                lp.completed_at,
                lp.created_at,
                lp.updated_at,
                l.title AS lesson_title
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            ORDER BY lp.user_id, lp.lesson_id
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// GET progress for a specific user
const getUserProgress = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(`
            SELECT
                lp.id,
                lp.user_id,
                lp.lesson_id,
                lp.status,
                lp.progress_percent,
                lp.completed_at,
                l.title AS lesson_title
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = $1
            ORDER BY l.module_id, l.lesson_order
        `, [userId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// ADD / UPDATE progress
const updateProgress = async (req, res) => {
    try {
        const { user_id, lesson_id, status, progress_percent } = req.body;

        if (!user_id || !lesson_id) {
            return res.status(400).json({
                success: false,
                message: "user_id and lesson_id are required"
            });
        }

        if (
            !["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        if (
            progress_percent < 0 ||
            progress_percent > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Progress must be between 0 and 100"
            });
        }

        const completedAt =
            status === "COMPLETED" ? "CURRENT_TIMESTAMP" : "NULL";

        const result = await pool.query(
            `INSERT INTO lesson_progress
            (
                user_id,
                lesson_id,
                status,
                progress_percent,
                completed_at
            )
            VALUES ($1, $2, $3, $4, ${completedAt})
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET
                status = EXCLUDED.status,
                progress_percent = EXCLUDED.progress_percent,
                completed_at = EXCLUDED.completed_at,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
                user_id,
                lesson_id,
                status,
                progress_percent
            ]
        );

        res.status(200).json({
            success: true,
            message: "Progress updated successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// DELETE progress
const deleteProgress = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM lesson_progress
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Progress record not found"
            });
        }

        res.json({
            success: true,
            message: "Progress deleted successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


module.exports = {
    getAllProgress,
    getUserProgress,
    updateProgress,
    deleteProgress
};