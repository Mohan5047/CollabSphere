const pool = require("../config/db");

// GET all questions
const getAllQuestions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                quiz_id,
                question,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                marks,
                created_at
            FROM quiz_questions
            ORDER BY id
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("GET QUESTIONS ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// GET questions for a specific quiz
const getQuestionsByQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;

        const result = await pool.query(`
            SELECT
                id,
                quiz_id,
                question,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                marks,
                created_at
            FROM quiz_questions
            WHERE quiz_id = $1
            ORDER BY id
        `, [quizId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("GET QUIZ QUESTIONS ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// ADD question
const addQuestion = async (req, res) => {
    try {
        const {
            quiz_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            marks
        } = req.body;

        if (
            !quiz_id ||
            !question ||
            !option_a ||
            !option_b ||
            !option_c ||
            !option_d ||
            !correct_option ||
            !marks
        ) {
            return res.status(400).json({
                success: false,
                message: "All question fields are required"
            });
        }

        const validOptions = ["A", "B", "C", "D"];

        if (!validOptions.includes(correct_option.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: "correct_option must be A, B, C or D"
            });
        }

        const result = await pool.query(
            `INSERT INTO quiz_questions
            (
                quiz_id,
                question,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                marks
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                quiz_id,
                question,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option.toUpperCase(),
                marks
            ]
        );

        res.status(201).json({
            success: true,
            message: "Question added successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ADD QUESTION ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


module.exports = {
    getAllQuestions,
    getQuestionsByQuiz,
    addQuestion
};