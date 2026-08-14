const pool = require("../config/db");

// ==========================================
// CREATE TASK
// ==========================================

const createTask = async (req, res) => {
    try {
        const {
            team_id,
            assigned_to,
            title,
            description,
            priority,
            due_date
        } = req.body;

        if (!team_id || !title) {
            return res.status(400).json({
                success: false,
                message: "team_id and title are required"
            });
        }

        // Check team
        const team = await pool.query(
            `SELECT id FROM teams WHERE id = $1`,
            [team_id]
        );

        if (team.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        // If assigned_to is provided, check user
        if (assigned_to) {
            const user = await pool.query(
                `SELECT id FROM users WHERE id = $1`,
                [assigned_to]
            );

            if (user.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned user not found"
                });
            }
        }

        const result = await pool.query(
            `INSERT INTO tasks
            (
                team_id,
                assigned_to,
                title,
                description,
                priority,
                due_date
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                team_id,
                assigned_to || null,
                title,
                description || null,
                priority || "MEDIUM",
                due_date || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("CREATE TASK ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET TEAM TASKS
// ==========================================

const getTeamTasks = async (req, res) => {
    try {
        const { teamId } = req.params;

        const result = await pool.query(`
            SELECT
                t.id,
                t.team_id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.created_at,
                t.assigned_to,
                u.full_name AS assigned_user,
                u.email AS assigned_email
            FROM tasks t
            LEFT JOIN users u
                ON t.assigned_to = u.id
            WHERE t.team_id = $1
            ORDER BY t.created_at DESC
        `, [teamId]);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("GET TEAM TASKS ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// GET TASK BY ID
// ==========================================

const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;

        const result = await pool.query(`
            SELECT
                t.id,
                t.team_id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.created_at,
                t.assigned_to,
                u.full_name AS assigned_user,
                u.email AS assigned_email
            FROM tasks t
            LEFT JOIN users u
                ON t.assigned_to = u.id
            WHERE t.id = $1
        `, [taskId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("GET TASK ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// UPDATE TASK STATUS
// ==========================================

const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "status is required"
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET status = $1
             WHERE id = $2
             RETURNING *`,
            [status, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("UPDATE TASK STATUS ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// ASSIGN TASK
// ==========================================

const assignTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "user_id is required"
            });
        }

        const user = await pool.query(
            `SELECT id FROM users WHERE id = $1`,
            [user_id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET assigned_to = $1
             WHERE id = $2
             RETURNING *`,
            [user_id, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task assigned successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("ASSIGN TASK ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// DELETE TASK
// ==========================================

const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const result = await pool.query(
            `DELETE FROM tasks
             WHERE id = $1
             RETURNING *`,
            [taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE TASK ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createTask,
    getTeamTasks,
    getTaskById,
    updateTaskStatus,
    assignTask,
    deleteTask
};