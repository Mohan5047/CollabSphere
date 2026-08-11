const pool = require("../config/db");

// GET all modules
const getAllModules = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                m.id,
                m.course_id,
                m.title,
                m.description,
                m.module_order,
                m.created_at,
                c.title AS course_title
            FROM modules m
            JOIN courses c
                ON m.course_id = c.id
            ORDER BY m.course_id, m.module_order
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


// GET module by ID
const getModuleById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                m.id,
                m.course_id,
                m.title,
                m.description,
                m.module_order,
                m.created_at,
                c.title AS course_title
            FROM modules m
            JOIN courses c
                ON m.course_id = c.id
            WHERE m.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
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


// GET modules by course
const getModulesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const result = await pool.query(`
            SELECT
                id,
                course_id,
                title,
                description,
                module_order,
                created_at
            FROM modules
            WHERE course_id = $1
            ORDER BY module_order ASC
        `, [courseId]);

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


// ADD module
const addModule = async (req, res) => {
    try {
        const {
            course_id,
            title,
            description,
            module_order
        } = req.body;

        if (!course_id || !title || !module_order) {
            return res.status(400).json({
                success: false,
                message: "course_id, title and module_order are required"
            });
        }

        // Check whether course exists
        const course = await pool.query(
            "SELECT id FROM courses WHERE id = $1",
            [course_id]
        );

        if (course.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Prevent duplicate module order in same course
        const existing = await pool.query(
            `SELECT id
             FROM modules
             WHERE course_id = $1
             AND module_order = $2`,
            [course_id, module_order]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This module order already exists for this course"
            });
        }

        const result = await pool.query(
            `INSERT INTO modules
            (
                course_id,
                title,
                description,
                module_order
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                course_id,
                title,
                description,
                module_order
            ]
        );

        res.status(201).json({
            success: true,
            message: "Module added successfully",
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


// UPDATE module
const updateModule = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            course_id,
            title,
            description,
            module_order
        } = req.body;

        if (!course_id || !title || !module_order) {
            return res.status(400).json({
                success: false,
                message: "course_id, title and module_order are required"
            });
        }

        // Check course
        const course = await pool.query(
            "SELECT id FROM courses WHERE id = $1",
            [course_id]
        );

        if (course.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Prevent duplicate module order
        const duplicate = await pool.query(
            `SELECT id
             FROM modules
             WHERE course_id = $1
             AND module_order = $2
             AND id <> $3`,
            [course_id, module_order, id]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This module order already exists for this course"
            });
        }

        const result = await pool.query(
            `UPDATE modules
             SET course_id = $1,
                 title = $2,
                 description = $3,
                 module_order = $4
             WHERE id = $5
             RETURNING *`,
            [
                course_id,
                title,
                description,
                module_order,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Module updated successfully",
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


// DELETE module
const deleteModule = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM modules
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Module deleted successfully"
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
    getAllModules,
    getModuleById,
    getModulesByCourse,
    addModule,
    updateModule,
    deleteModule
};