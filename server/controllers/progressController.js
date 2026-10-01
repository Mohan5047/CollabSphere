const pool = require("../config/db");
const crypto = require("crypto");

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

        // Check and update overall course progress
        let courseProgressData = null;
        const courseQuery = await pool.query(
            `SELECT m.course_id, c.title AS course_title
             FROM lessons l
             JOIN modules m ON l.module_id = m.id
             JOIN courses c ON m.course_id = c.id
             WHERE l.id = $1`,
            [lesson_id]
        );

        if (courseQuery.rows.length > 0) {
            const courseId = courseQuery.rows[0].course_id;

            // Total lessons in this course
            const totalQuery = await pool.query(
                `SELECT COUNT(l.id) AS total_lessons
                 FROM modules m
                 JOIN lessons l ON l.module_id = m.id
                 WHERE m.course_id = $1`,
                [courseId]
            );
            const totalLessons = parseInt(totalQuery.rows[0].total_lessons, 10) || 1;

            // Completed lessons by this user in this course
            const completedQuery = await pool.query(
                `SELECT COUNT(DISTINCT lp.lesson_id) AS completed_lessons
                 FROM modules m
                 JOIN lessons l ON l.module_id = m.id
                 JOIN lesson_progress lp ON lp.lesson_id = l.id
                 WHERE m.course_id = $1 AND lp.user_id = $2 AND lp.status = 'COMPLETED'`,
                [courseId, user_id]
            );
            const completedLessons = parseInt(completedQuery.rows[0].completed_lessons, 10) || 0;

            const progressPct = Math.min(100, Math.round((completedLessons / totalLessons) * 100));
            const progressStatus = progressPct >= 100 ? "COMPLETED" : "IN_PROGRESS";

            // Count completed modules (where every lesson in the module is COMPLETED)
            const completedModulesQuery = await pool.query(
                `SELECT COUNT(DISTINCT m.id) AS completed_modules
                 FROM modules m
                 WHERE m.course_id = $1
                   AND NOT EXISTS (
                       SELECT 1
                       FROM lessons l
                       LEFT JOIN lesson_progress lp
                           ON lp.lesson_id = l.id AND lp.user_id = $2
                       WHERE l.module_id = m.id
                         AND (lp.status IS NULL OR lp.status != 'COMPLETED')
                   )`,
                [courseId, user_id]
            );
            const completedModules = parseInt(completedModulesQuery.rows[0].completed_modules, 10) || 0;

            // Upsert into user_progress
            await pool.query(
                `INSERT INTO user_progress
                 (user_id, course_id, completed_modules, completed_lessons, progress_percentage, status, last_accessed)
                 VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, course_id)
                 DO UPDATE SET
                     completed_modules = EXCLUDED.completed_modules,
                     completed_lessons = EXCLUDED.completed_lessons,
                     progress_percentage = EXCLUDED.progress_percentage,
                     status = EXCLUDED.status,
                     last_accessed = CURRENT_TIMESTAMP`,
                [user_id, courseId, completedModules, completedLessons, progressPct, progressStatus]
            );

            // Ensure enrollment exists and update status if completed
            await pool.query(
                `INSERT INTO course_enrollments (user_id, course_id, status)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, course_id)
                 DO UPDATE SET status = CASE WHEN $3 = 'COMPLETED' THEN 'COMPLETED' ELSE course_enrollments.status END`,
                [user_id, courseId, progressStatus]
            );

            // If 100% complete, automatically generate certificate if not already issued
            let certificateRecord = null;
            if (progressPct >= 100) {
                const existingCert = await pool.query(
                    "SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2",
                    [user_id, courseId]
                );

                if (existingCert.rows.length === 0) {
                    const certNum = "CS-2026-" + crypto.randomBytes(4).toString("hex").toUpperCase();
                    const newCert = await pool.query(
                        `INSERT INTO certificates (user_id, course_id, certificate_number, issued_at)
                         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                         RETURNING *`,
                        [user_id, courseId, certNum]
                    );
                    certificateRecord = newCert.rows[0];
                } else {
                    certificateRecord = existingCert.rows[0];
                }
            }

            courseProgressData = {
                course_id: courseId,
                total_lessons: totalLessons,
                completed_lessons: completedLessons,
                progress_percentage: progressPct,
                status: progressStatus,
                certificate: certificateRecord
            };
        }

        res.status(200).json({
            success: true,
            message: "Progress updated successfully",
            data: result.rows[0],
            course_progress: courseProgressData
        });

    } catch (err) {
        console.error("UPDATE PROGRESS ERROR:", err);

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