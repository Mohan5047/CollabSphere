const pool = require("../config/db");

const getAllQuizzes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                q.id,
                q.module_id,
                q.title,
                q.description,
                q.passing_marks,
                q.total_marks,
                q.time_limit_minutes,
                q.is_active,
                q.created_at,
                m.title AS module_title
            FROM quizzes q
            JOIN modules m
                ON q.module_id = m.id
            ORDER BY q.id
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("GET QUIZZES ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                q.id,
                q.module_id,
                q.title,
                q.description,
                q.passing_marks,
                q.total_marks,
                q.time_limit_minutes,
                q.is_active,
                q.created_at,
                m.title AS module_title
            FROM quizzes q
            JOIN modules m
                ON q.module_id = m.id
            WHERE q.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error("GET QUIZ ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
const addQuiz = async (req, res) => {
    try {
        const {
            module_id,
            title,
            description,
            passing_marks,
            total_marks,
            time_limit_minutes,
            is_active
        } = req.body;

        if (
            !module_id ||
            !title ||
            passing_marks === undefined ||
            total_marks === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "module_id, title, passing_marks and total_marks are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO quizzes
            (
                module_id,
                title,
                description,
                passing_marks,
                total_marks,
                time_limit_minutes,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                module_id,
                title,
                description || null,
                passing_marks,
                total_marks,
                time_limit_minutes || 30,
                is_active !== undefined ? is_active : true
            ]
        );

        res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ADD QUIZ ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    getAllQuizzes,
    getQuizById,
    addQuiz
};