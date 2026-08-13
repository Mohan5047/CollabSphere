 const pool = require("../config/db");

const getUserDashboard = async (req, res) => {
    try {
        const { userId } = req.params;

        // User
        const userResult = await pool.query(
            `SELECT id, full_name, email
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Enrolled courses
        const coursesResult = await pool.query(`
    SELECT
        ce.id AS enrollment_id,
        c.id AS course_id,
        c.title AS course_title,
        ce.enrolled_at,

        COALESCE(up.completed_modules, 0) AS completed_modules,
        COALESCE(up.completed_lessons, 0) AS completed_lessons,
        COALESCE(up.progress_percentage, 0) AS progress_percentage,
        COALESCE(up.status, 'NOT_STARTED') AS progress_status,
        up.last_accessed

    FROM course_enrollments ce

    JOIN courses c
        ON ce.course_id = c.id

    LEFT JOIN user_progress up
        ON up.course_id = ce.course_id
        AND up.user_id = ce.user_id

    WHERE ce.user_id = $1

    ORDER BY ce.enrolled_at DESC
`, [userId]);
        // Quiz attempts
        const quizResult = await pool.query(`
            SELECT
                qa.id AS attempt_id,
                qa.quiz_id,
                q.title AS quiz_title,
                qa.score,
                qa.total_marks,
                qa.percentage,
                qa.passed,
                qa.completed_at
            FROM quiz_attempts qa
            JOIN quizzes q
                ON qa.quiz_id = q.id
            WHERE qa.user_id = $1
            ORDER BY qa.completed_at DESC
            LIMIT 5
        `, [userId]);

        // Certificates
        const certificateResult = await pool.query(`
            SELECT
                cert.id,
                cert.certificate_number,
                cert.issued_at,
                c.id AS course_id,
                c.title AS course_title
            FROM certificates cert
            JOIN courses c
                ON cert.course_id = c.id
            WHERE cert.user_id = $1
            ORDER BY cert.issued_at DESC
        `, [userId]);

        // Statistics
        const statsResult = await pool.query(`
    SELECT
        (
            SELECT COUNT(*)
            FROM course_enrollments
            WHERE user_id = $1
        ) AS enrolled_courses,

        (
            SELECT COUNT(*)
            FROM user_progress
            WHERE user_id = $1
            AND status = 'COMPLETED'
        ) AS completed_courses,

        (
            SELECT COUNT(*)
            FROM certificates
            WHERE user_id = $1
        ) AS certificates,

        (
            SELECT COUNT(*)
            FROM quiz_attempts
            WHERE user_id = $1
        ) AS quiz_attempts
`, [userId]);

        res.json({
            success: true,

            user: userResult.rows[0],

           stats: {
    enrolled_courses: Number(statsResult.rows[0].enrolled_courses),
    completed_courses: Number(statsResult.rows[0].completed_courses),
    certificates: Number(statsResult.rows[0].certificates),
    quiz_attempts: Number(statsResult.rows[0].quiz_attempts)
},

            courses: coursesResult.rows,

            recent_quizzes: quizResult.rows,

            certificates: certificateResult.rows
        });

    } catch (error) {
        console.error("DASHBOARD ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getUserDashboard
};