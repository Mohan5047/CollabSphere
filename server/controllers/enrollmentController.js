const pool = require("../config/db");

const enrollUser = async (req, res) => {
    try {
        const { user_id, course_id } = req.body;

        if (!user_id || !course_id) {
            return res.status(400).json({
                success: false,
                message: "user_id and course_id are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO course_enrollments
             (user_id, course_id)
             VALUES ($1, $2)
             RETURNING *`,
            [user_id, course_id]
        );

        res.status(201).json({
            success: true,
            message: "User enrolled successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ENROLLMENT ERROR:", err);

        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "User is already enrolled in this course"
            });
        }

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
const getAllEnrollments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ce.id,
                ce.user_id,
                ce.course_id,
                ce.enrolled_at,
                ce.status,
                u.full_name,
                u.email,
                c.title AS course_title
            FROM course_enrollments ce
            JOIN users u ON ce.user_id = u.id
            JOIN courses c ON ce.course_id = c.id
            ORDER BY ce.enrolled_at DESC
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

const getUserEnrollments = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(`
            SELECT
                ce.id,
                ce.user_id,
                ce.course_id,
                ce.enrolled_at,
                ce.status,
                c.title AS course_title
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = $1
            ORDER BY ce.enrolled_at DESC
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
module.exports = {
    enrollUser,
    getAllEnrollments,
    getUserEnrollments
};