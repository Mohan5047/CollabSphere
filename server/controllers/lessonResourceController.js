 const pool = require("../config/db");

// GET all resources
const getAllResources = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                lr.id,
                lr.lesson_id,
                lr.resource_type,
                lr.title,
                lr.resource_url,
                lr.created_at,
                l.title AS lesson_title
            FROM lesson_resources lr
            JOIN lessons l ON lr.lesson_id = l.id
            ORDER BY lr.lesson_id, lr.id
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("GET RESOURCES ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// GET resource by ID
const getResourceById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                lr.id,
                lr.lesson_id,
                lr.resource_type,
                lr.title,
                lr.resource_url,
                lr.created_at,
                l.title AS lesson_title
            FROM lesson_resources lr
            JOIN lessons l ON lr.lesson_id = l.id
            WHERE lr.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error("GET RESOURCE ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// GET resources by lesson
const getResourcesByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const result = await pool.query(`
            SELECT
                id,
                lesson_id,
                resource_type,
                title,
                resource_url,
                created_at
            FROM lesson_resources
            WHERE lesson_id = $1
            ORDER BY id ASC
        `, [lessonId]);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("GET LESSON RESOURCES ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// ADD resource
const addResource = async (req, res) => {
    try {
        console.log("🔥 ADD RESOURCE API CALLED");
        console.log("BODY:", req.body);

        const {
            lesson_id,
            resource_type,
            title,
            resource_url
        } = req.body;

        if (!lesson_id || !resource_type || !title || !resource_url) {
            return res.status(400).json({
                success: false,
                message: "lesson_id, resource_type, title and resource_url are required"
            });
        }

        const lesson = await pool.query(
            "SELECT id FROM lessons WHERE id = $1",
            [lesson_id]
        );

        if (lesson.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const result = await pool.query(
            `INSERT INTO lesson_resources
            (
                lesson_id,
                resource_type,
                title,
                resource_url
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                lesson_id,
                resource_type,
                title,
                resource_url
            ]
        );

        res.status(201).json({
            success: true,
            message: "Resource added successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ADD RESOURCE ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// UPDATE resource
const updateResource = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            lesson_id,
            resource_type,
            title,
            resource_url
        } = req.body;

        if (!lesson_id || !resource_type || !title || !resource_url) {
            return res.status(400).json({
                success: false,
                message: "lesson_id, resource_type, title and resource_url are required"
            });
        }

        const lesson = await pool.query(
            "SELECT id FROM lessons WHERE id = $1",
            [lesson_id]
        );

        if (lesson.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const result = await pool.query(
            `UPDATE lesson_resources
             SET lesson_id = $1,
                 resource_type = $2,
                 title = $3,
                 resource_url = $4
             WHERE id = $5
             RETURNING *`,
            [
                lesson_id,
                resource_type,
                title,
                resource_url,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Resource updated successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("UPDATE RESOURCE ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// DELETE resource
const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM lesson_resources
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Resource deleted successfully"
        });

    } catch (err) {
        console.error("DELETE RESOURCE ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


module.exports = {
    getAllResources,
    getResourceById,
    getResourcesByLesson,
    addResource,
    updateResource,
    deleteResource
};