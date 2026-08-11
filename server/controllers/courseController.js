const pool = require("../config/db");

// GET all courses
const getAllCourses = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id,
                c.title,
                c.description,
                c.thumbnail_url,
                c.level,
                c.duration_hours,
                c.is_published,
                lt.id AS track_id,
                lt.name AS track_name
            FROM courses c
            JOIN learning_tracks lt
                ON c.track_id = lt.id
            ORDER BY c.id ASC
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


// GET course by ID
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                c.id,
                c.title,
                c.description,
                c.thumbnail_url,
                c.level,
                c.duration_hours,
                c.is_published,
                lt.id AS track_id,
                lt.name AS track_name
            FROM courses c
            JOIN learning_tracks lt
                ON c.track_id = lt.id
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
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


// ADD course
const addCourse = async (req, res) => {
    try {
        const {
            track_id,
            title,
            description,
            thumbnail_url,
            level,
            duration_hours,
            is_published
        } = req.body;

        if (!track_id || !title) {
            return res.status(400).json({
                success: false,
                message: "track_id and title are required"
            });
        }

        // Check whether track exists
        const track = await pool.query(
            "SELECT id FROM learning_tracks WHERE id = $1",
            [track_id]
        );

        if (track.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Learning track not found"
            });
        }

        const result = await pool.query(
            `INSERT INTO courses
            (
                track_id,
                title,
                description,
                thumbnail_url,
                level,
                duration_hours,
                is_published
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
                track_id,
                title,
                description,
                thumbnail_url,
                level,
                duration_hours || 0,
                is_published || false
            ]
        );

        res.status(201).json({
            success: true,
            message: "Course added successfully",
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


// UPDATE course
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            track_id,
            title,
            description,
            thumbnail_url,
            level,
            duration_hours,
            is_published
        } = req.body;

        if (!track_id || !title) {
            return res.status(400).json({
                success: false,
                message: "track_id and title are required"
            });
        }

        const track = await pool.query(
            "SELECT id FROM learning_tracks WHERE id = $1",
            [track_id]
        );

        if (track.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Learning track not found"
            });
        }

        const result = await pool.query(
            `UPDATE courses
             SET track_id = $1,
                 title = $2,
                 description = $3,
                 thumbnail_url = $4,
                 level = $5,
                 duration_hours = $6,
                 is_published = $7
             WHERE id = $8
             RETURNING *`,
            [
                track_id,
                title,
                description,
                thumbnail_url,
                level,
                duration_hours || 0,
                is_published || false,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
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


// DELETE course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM courses
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
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
    getAllCourses,
    getCourseById,
    addCourse,
    updateCourse,
    deleteCourse
};