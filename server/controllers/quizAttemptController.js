const pool = require("../config/db");

const submitQuiz = async (req, res) => {

    const client = await pool.connect();

    try {
        const { user_id, quiz_id, answers } = req.body;

        if (!user_id || !quiz_id || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "user_id, quiz_id and answers are required"
            });
        }

        await client.query("BEGIN");

        // Get quiz details
        const quizResult = await client.query(
            `SELECT id, total_marks, passing_marks
             FROM quizzes
             WHERE id = $1`,
            [quiz_id]
        );

        if (quizResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        const quiz = quizResult.rows[0];

        // Create attempt
        const attemptResult = await client.query(
            `INSERT INTO quiz_attempts
             (user_id, quiz_id, total_marks)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [user_id, quiz_id, quiz.total_marks]
        );

        const attempt = attemptResult.rows[0];

        let score = 0;

        // Check every answer
        for (const answer of answers) {

            const { question_id, selected_option } = answer;

            const questionResult = await client.query(
                `SELECT correct_option, marks
                 FROM quiz_questions
                 WHERE id = $1
                 AND quiz_id = $2`,
                [question_id, quiz_id]
            );

            if (questionResult.rows.length === 0) {
                continue;
            }

            const question = questionResult.rows[0];

            const selected = selected_option.toUpperCase();

            const isCorrect =
                selected === question.correct_option.toUpperCase();

            const marksObtained = isCorrect
                ? question.marks
                : 0;

            if (isCorrect) {
                score += question.marks;
            }

            await client.query(
                `INSERT INTO quiz_answers
                (
                    attempt_id,
                    question_id,
                    selected_option,
                    is_correct,
                    marks_obtained
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    attempt.id,
                    question_id,
                    selected,
                    isCorrect,
                    marksObtained
                ]
            );
        }

        // Calculate percentage
        const percentage =
            quiz.total_marks > 0
                ? (score / quiz.total_marks) * 100
                : 0;

        const passed = score >= quiz.passing_marks;

        // Update attempt
        const updatedAttempt = await client.query(
            `UPDATE quiz_attempts
             SET
                score = $1,
                percentage = $2,
                passed = $3,
                completed_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [
                score,
                percentage.toFixed(2),
                passed,
                attempt.id
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Quiz submitted successfully",
            result: {
                attempt_id: updatedAttempt.rows[0].id,
                score,
                total_marks: quiz.total_marks,
                percentage: Number(percentage.toFixed(2)),
                passed
            }
        });

    } catch (err) {
        await client.query("ROLLBACK");

        console.error("SUBMIT QUIZ ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    } finally {
        client.release();
    }
};
const getUserAttempts = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(`
            SELECT
                qa.id AS attempt_id,
                qa.user_id,
                qa.quiz_id,
                q.title AS quiz_title,
                qa.score,
                qa.total_marks,
                qa.percentage,
                qa.passed,
                qa.started_at,
                qa.completed_at
            FROM quiz_attempts qa
            JOIN quizzes q
                ON qa.quiz_id = q.id
            WHERE qa.user_id = $1
            ORDER BY qa.completed_at DESC
        `, [userId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("GET USER ATTEMPTS ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    submitQuiz,
    getUserAttempts
};