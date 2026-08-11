const pool = require("../config/db");

// GET all lessons
const getAllLessons = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                l.id,
                l.module_id,
                l.title,
                l.description,
                l.lesson_order,
                l.duration_minutes,
                l.is_free,
                l.created_at,
                m.title AS module_title
            FROM lessons l
            JOIN modules m
                ON l.module_id = m.id
            ORDER BY l.module_id, l.lesson_order
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// GET lesson by ID
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                l.id,
                l.module_id,
                l.title,
                l.description,
                l.lesson_order,
                l.duration_minutes,
                l.is_free,
                l.created_at,
                m.title AS module_title
            FROM lessons l
            JOIN modules m
                ON l.module_id = m.id
            WHERE l.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// GET lessons by module
const getLessonsByModule = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const result = await pool.query(`
            SELECT
                id,
                module_id,
                title,
                description,
                lesson_order,
                duration_minutes,
                is_free,
                created_at
            FROM lessons
            WHERE module_id = $1
            ORDER BY lesson_order ASC
        `, [moduleId]);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// ADD lesson
const addLesson = async (req, res) => {
    try {
        const {
            module_id,
            title,
            description,
            lesson_order,
            duration_minutes,
            is_free
        } = req.body;

        if (!module_id || !title || !lesson_order) {
            return res.status(400).json({
                success: false,
                message: "module_id, title and lesson_order are required"
            });
        }

        // Check module exists
        const module = await pool.query(
            "SELECT id FROM modules WHERE id = $1",
            [module_id]
        );

        if (module.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        // Prevent duplicate lesson order
        const existing = await pool.query(
            `SELECT id
             FROM lessons
             WHERE module_id = $1
             AND lesson_order = $2`,
            [module_id, lesson_order]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This lesson order already exists for this module"
            });
        }

        const result = await pool.query(
            `INSERT INTO lessons
            (
                module_id,
                title,
                description,
                lesson_order,
                duration_minutes,
                is_free
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                module_id,
                title,
                description || null,
                lesson_order,
                duration_minutes || 0,
                is_free ?? false
            ]
        );

        res.status(201).json({
            success: true,
            message: "Lesson added successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// UPDATE lesson
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            module_id,
            title,
            description,
            lesson_order,
            duration_minutes,
            is_free
        } = req.body;

        if (!module_id || !title || !lesson_order) {
            return res.status(400).json({
                success: false,
                message: "module_id, title and lesson_order are required"
            });
        }

        // Check module exists
        const module = await pool.query(
            "SELECT id FROM modules WHERE id = $1",
            [module_id]
        );

        if (module.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        // Prevent duplicate lesson order
        const duplicate = await pool.query(
            `SELECT id
             FROM lessons
             WHERE module_id = $1
             AND lesson_order = $2
             AND id <> $3`,
            [module_id, lesson_order, id]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This lesson order already exists for this module"
            });
        }

        const result = await pool.query(
            `UPDATE lessons
             SET module_id = $1,
                 title = $2,
                 description = $3,
                 lesson_order = $4,
                 duration_minutes = $5,
                 is_free = $6
             WHERE id = $7
             RETURNING *`,
            [
                module_id,
                title,
                description || null,
                lesson_order,
                duration_minutes || 0,
                is_free ?? false,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// DELETE lesson
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM lessons
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


module.exports = {
    getAllLessons,
    getLessonById,
    getLessonsByModule,
    addLesson,
    updateLesson,
    deleteLesson
};