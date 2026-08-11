 const pool = require("../config/db");

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM learning_categories ORDER BY id ASC"
        );

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

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM learning_categories WHERE id=$1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
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

// Add category
const addCategory = async (req, res) => {

    try {

        const { name, description } = req.body;

        const existing = await pool.query(
            "SELECT * FROM learning_categories WHERE name=$1",
            [name]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const result = await pool.query(
            `INSERT INTO learning_categories(name,description)
             VALUES($1,$2)
             RETURNING *`,
            [name, description]
        );

        res.status(201).json({
            success: true,
            message: "Category added successfully",
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

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Check if another category already has this name
        const duplicate = await pool.query(
            `SELECT * FROM learning_categories
             WHERE name = $1 AND id <> $2`,
            [name, id]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Category name already exists"
            });
        }

        const result = await pool.query(
            `UPDATE learning_categories
             SET name=$1,
                 description=$2
             WHERE id=$3
             RETURNING *`,
            [name, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category updated successfully",
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
// Delete category
const deleteCategory = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM learning_categories WHERE id=$1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category deleted successfully"
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

    getAllCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory

};