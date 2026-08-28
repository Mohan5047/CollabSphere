const pool = require("../config/db");

// ==========================================
// CHECK TEAM ACCESS
// ==========================================

const checkTeamAccess = async (teamId, userId) => {
    const result = await pool.query(
        `SELECT
            t.id,
            p.owner_id
         FROM teams t
         INNER JOIN projects p
            ON t.project_id = p.id
         WHERE t.id = $1
         AND (
            p.owner_id = $2
            OR EXISTS (
                SELECT 1
                FROM team_members tm
                WHERE tm.team_id = t.id
                AND tm.user_id = $2
            )
         )`,
        [teamId, userId]
    );

    return result.rows.length > 0;
};


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

        const userId = Number(req.user.id);

        // Validate required fields
        if (!team_id || !title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "team_id and title are required"
            });
        }

        // Check whether current user has access
        const hasAccess = await checkTeamAccess(
            team_id,
            userId
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not a member of this team"
            });
        }

        // If task is assigned to someone,
        // make sure that user belongs to the team
        if (assigned_to) {
            const member = await pool.query(
                `SELECT user_id
                 FROM team_members
                 WHERE team_id = $1
                 AND user_id = $2`,
                [
                    team_id,
                    assigned_to
                ]
            );

            if (member.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Assigned user is not a member of this team"
                });
            }
        }

        // ==========================================
        // PRIORITY VALIDATION
        // ==========================================

        const allowedPriorities = [
            "LOW",
            "MEDIUM",
            "HIGH"
        ];

        const taskPriority =
            priority || "MEDIUM";

        if (
            !allowedPriorities.includes(
                taskPriority
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid priority. Use LOW, MEDIUM or HIGH"
            });
        }

        // ==========================================
        // INSERT TASK
        // ==========================================

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
                title.trim(),
                description || null,
                taskPriority,
                due_date || null
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Task created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "CREATE TASK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// GET TEAM TASKS
// ==========================================

const getTeamTasks = async (req, res) => {
    try {
        const { teamId } = req.params;

        const userId =
            Number(req.user.id);

        const hasAccess =
            await checkTeamAccess(
                teamId,
                userId
            );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not a member of this team"
            });
        }

        const result = await pool.query(
            `SELECT
                t.id,
                t.team_id,
                t.assigned_to,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.created_at,

                u.full_name AS assigned_user,
                u.email AS assigned_email

             FROM tasks t

             LEFT JOIN users u
                ON t.assigned_to = u.id

             WHERE t.team_id = $1

             ORDER BY t.created_at DESC`,
            [teamId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "GET TEAM TASKS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// GET TASK BY ID
// ==========================================

const getTaskById = async (
    req,
    res
) => {
    try {
        const { taskId } =
            req.params;

        const userId =
            Number(req.user.id);

        const result = await pool.query(
            `SELECT
                t.id,
                t.team_id,
                t.assigned_to,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.created_at,

                u.full_name AS assigned_user,
                u.email AS assigned_email

             FROM tasks t

             LEFT JOIN users u
                ON t.assigned_to = u.id

             INNER JOIN teams tm
                ON t.team_id = tm.id

             INNER JOIN projects p
                ON tm.project_id = p.id

             WHERE t.id = $1

             AND (
                p.owner_id = $2

                OR EXISTS (
                    SELECT 1
                    FROM team_members member
                    WHERE member.team_id = t.team_id
                    AND member.user_id = $2
                )
             )`,
            [
                taskId,
                userId
            ]
        );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Task not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "GET TASK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// UPDATE TASK STATUS
// ==========================================

const updateTaskStatus = async (
    req,
    res
) => {
    try {
        const { taskId } =
            req.params;

        const { status } =
            req.body;

        const userId =
            Number(req.user.id);

        if (!status) {
            return res.status(400).json({
                success: false,
                message:
                    "status is required"
            });
        }

        // ==========================================
        // EXACT STATUS VALUES FROM DATABASE
        // ==========================================

        const allowedStatuses = [
            "TODO",
            "IN_PROGRESS",
            "COMPLETED"
        ];

        if (
            !allowedStatuses.includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid status. Use TODO, IN_PROGRESS or COMPLETED"
            });
        }

        const result = await pool.query(
            `UPDATE tasks t

             SET status = $1

             FROM teams tm
             INNER JOIN projects p
                ON tm.project_id = p.id

             WHERE t.id = $2

             AND t.team_id = tm.id

             AND (
                p.owner_id = $3

                OR EXISTS (
                    SELECT 1
                    FROM team_members member
                    WHERE member.team_id = t.team_id
                    AND member.user_id = $3
                )
             )

             RETURNING t.*`,
            [
                status,
                taskId,
                userId
            ]
        );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Task not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Task status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "UPDATE TASK STATUS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// ASSIGN TASK
// ==========================================

const assignTask = async (
    req,
    res
) => {
    try {
        const { taskId } =
            req.params;

        const { user_id } =
            req.body;

        const currentUserId =
            Number(req.user.id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message:
                    "user_id is required"
            });
        }

        // Get task + team + project
        const task = await pool.query(
            `SELECT
                t.id,
                t.team_id,
                p.owner_id

             FROM tasks t

             INNER JOIN teams tm
                ON t.team_id = tm.id

             INNER JOIN projects p
                ON tm.project_id = p.id

             WHERE t.id = $1`,
            [taskId]
        );

        if (
            task.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Task not found"
            });
        }

        const taskData =
            task.rows[0];

        // Check current user access
        const hasAccess =
            Number(
                taskData.owner_id
            ) === currentUserId ||
            await checkTeamAccess(
                taskData.team_id,
                currentUserId
            );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to assign this task"
            });
        }

        // ==========================================
        // CHECK ASSIGNED USER
        // ==========================================

        const member =
            await pool.query(
                `SELECT id
                 FROM team_members
                 WHERE team_id = $1
                 AND user_id = $2`,
                [
                    taskData.team_id,
                    user_id
                ]
            );

        if (
            member.rows.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "User is not a member of this team"
            });
        }

        // ==========================================
        // ASSIGN TASK
        // ==========================================

        const result =
            await pool.query(
                `UPDATE tasks
                 SET assigned_to = $1
                 WHERE id = $2
                 RETURNING *`,
                [
                    user_id,
                    taskId
                ]
            );

        res.status(200).json({
            success: true,
            message:
                "Task assigned successfully",
            data:
                result.rows[0]
        });

    } catch (error) {
        console.error(
            "ASSIGN TASK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// DELETE TASK
// ==========================================

const deleteTask = async (
    req,
    res
) => {
    try {
        const { taskId } =
            req.params;

        const userId =
            Number(req.user.id);

        // Only project owner can delete
        const result =
            await pool.query(
                `DELETE FROM tasks t

                 USING teams tm,
                       projects p

                 WHERE t.id = $1

                 AND t.team_id = tm.id

                 AND tm.project_id = p.id

                 AND p.owner_id = $2

                 RETURNING t.*`,
                [
                    taskId,
                    userId
                ]
            );

        if (
            result.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Task not found or only project owner can delete it"
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Task deleted successfully",
            data:
                result.rows[0]
        });

    } catch (error) {
        console.error(
            "DELETE TASK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    createTask,
    getTeamTasks,
    getTaskById,
    updateTaskStatus,
    assignTask,
    deleteTask
};