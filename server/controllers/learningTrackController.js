 const pool = require("../config/db");

// GET all tracks
const getAllTracks = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                lt.id,
                lt.name,
                lt.description,
                lt.difficulty,
                lt.image_url,
                lc.id AS category_id,
                lc.name AS category_name
            FROM learning_tracks lt
            JOIN learning_categories lc
                ON lt.category_id = lc.id
            ORDER BY lt.id ASC
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


// GET track by ID
const getTrackById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                lt.id,
                lt.name,
                lt.description,
                lt.difficulty,
                lt.image_url,
                lc.id AS category_id,
                lc.name AS category_name
            FROM learning_tracks lt
            JOIN learning_categories lc
                ON lt.category_id = lc.id
            WHERE lt.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Learning track not found"
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


// ADD track
const addTrack = async (req, res) => {
    try {
        const {
            category_id,
            name,
            description,
            difficulty,
            image_url
        } = req.body;

        if (!category_id || !name) {
            return res.status(400).json({
                success: false,
                message: "category_id and name are required"
            });
        }

        // Check category exists
        const category = await pool.query(
            "SELECT id FROM learning_categories WHERE id = $1",
            [category_id]
        );

        if (category.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Prevent duplicate track in same category
        const existing = await pool.query(
            `SELECT id
             FROM learning_tracks
             WHERE name = $1 AND category_id = $2`,
            [name, category_id]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Track already exists in this category"
            });
        }

        const result = await pool.query(
            `INSERT INTO learning_tracks
            (category_id, name, description, difficulty, image_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                category_id,
                name,
                description,
                difficulty,
                image_url
            ]
        );

        res.status(201).json({
            success: true,
            message: "Learning track added successfully",
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


// UPDATE track
const updateTrack = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            category_id,
            name,
            description,
            difficulty,
            image_url
        } = req.body;

        if (!category_id || !name) {
            return res.status(400).json({
                success: false,
                message: "category_id and name are required"
            });
        }

        // Check category
        const category = await pool.query(
            "SELECT id FROM learning_categories WHERE id = $1",
            [category_id]
        );

        if (category.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check duplicate
        const duplicate = await pool.query(
            `SELECT id
             FROM learning_tracks
             WHERE name = $1
             AND category_id = $2
             AND id <> $3`,
            [name, category_id, id]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another track with this name already exists in this category"
            });
        }

        const result = await pool.query(
            `UPDATE learning_tracks
             SET category_id = $1,
                 name = $2,
                 description = $3,
                 difficulty = $4,
                 image_url = $5
             WHERE id = $6
             RETURNING *`,
            [
                category_id,
                name,
                description,
                difficulty,
                image_url,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Learning track not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Learning track updated successfully",
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


// DELETE track
const deleteTrack = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM learning_tracks
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Learning track not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Learning track deleted successfully"
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
    getAllTracks,
    getTrackById,
    addTrack,
    updateTrack,
    deleteTrack
};