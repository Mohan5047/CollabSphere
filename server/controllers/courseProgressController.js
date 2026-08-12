const pool = require("../config/db");

// GET course progress for a user
const getCourseProgress = async (req, res) => {
    try {
        const { userId, courseId } = req.params;

        const result = await pool.query(`
            SELECT
                c.id AS course_id,
                c.title AS course_title,

                COUNT(l.id) AS total_lessons,

                COUNT(
                    CASE
                        WHEN lp.status = 'COMPLETED'
                        THEN 1
                    END
                ) AS completed_lessons,

                COUNT(
                    CASE
                        WHEN lp.status = 'IN_PROGRESS'
                        THEN 1
                    END
                ) AS in_progress_lessons,

                COUNT(
                    CASE
                        WHEN lp.id IS NULL
                        OR lp.status = 'NOT_STARTED'
                        THEN 1
                    END
                ) AS remaining_lessons

            FROM courses c

            JOIN modules m
                ON m.course_id = c.id

            JOIN lessons l
                ON l.module_id = m.id

            LEFT JOIN lesson_progress lp
                ON lp.lesson_id = l.id
                AND lp.user_id = $1

            WHERE c.id = $2

            GROUP BY c.id, c.title
        `, [userId, courseId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found or has no lessons"
            });
        }

        const data = result.rows[0];

        const totalLessons = Number(data.total_lessons);
        const completedLessons = Number(data.completed_lessons);

        const completionPercentage =
            totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0;

        res.status(200).json({
            success: true,
            data: {
                course_id: data.course_id,
                course_title: data.course_title,
                total_lessons: totalLessons,
                completed_lessons: completedLessons,
                in_progress_lessons: Number(data.in_progress_lessons),
                remaining_lessons: Number(data.remaining_lessons),
                completion_percentage: completionPercentage
            }
        });

    } catch (err) {
        console.error("COURSE PROGRESS ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


module.exports = {
    getCourseProgress
};