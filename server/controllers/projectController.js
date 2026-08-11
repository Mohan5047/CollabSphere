const pool = require("../config/db");

// =========================
// Create Project Controller
// =========================
const createProjectController = async (req, res) => {
    try {

        // Get data from request body
        const { title, description, tech_stack } = req.body;

        // Validation
        if (!title || !description || !tech_stack) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Insert project into database
        const project = await pool.query(
            `INSERT INTO projects
            (title, description, tech_stack, owner_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                title,
                description,
                tech_stack,
                req.user.id
            ]
        );

        // Success response
        res.status(201).json({
            success: true,
            message: "Project Created Successfully",
            project: project.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
// =========================
// Get All Projects Controller
// =========================
const getAllProjectsController = async (req, res) => {
    try {

        const projects = await pool.query(
            `SELECT
                projects.id,
                projects.title,
                projects.description,
                projects.tech_stack,
                projects.created_at,
                users.full_name AS owner_name
            FROM projects
            INNER JOIN users
            ON projects.owner_id = users.id
            ORDER BY projects.created_at DESC`
        );

        res.status(200).json({
            success: true,
            totalProjects: projects.rows.length,
            projects: projects.rows
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
// =========================
// Get My Projects Controller
// =========================
const getMyProjectsController = async (req, res) => {
    try {

        const projects = await pool.query(
            `SELECT
                id,
                title,
                description,
                tech_stack,
                created_at
             FROM projects
             WHERE owner_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            totalProjects: projects.rows.length,
            projects: projects.rows
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
// =========================
// Delete Project Controller
// =========================
const deleteProjectController = async (req, res) => {
    try {

        const { id } = req.params;

        // Find project
        const project = await pool.query(
            "SELECT * FROM projects WHERE id = $1",
            [id]
        );

        // Check if project exists
        if (project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Check ownership
        if (project.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this project"
            });
        }

        // Delete project
        await pool.query(
            "DELETE FROM projects WHERE id = $1",
            [id]
        );

        res.status(200).json({
            success: true,
            message: "Project Deleted Successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
// =========================
// Update Project Controller
// =========================
const updateProjectController = async (req, res) => {
    try {

        const { id } = req.params;
        const { title, description, tech_stack } = req.body;

        // Validation
        if (!title || !description || !tech_stack) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if project exists
        const project = await pool.query(
            "SELECT * FROM projects WHERE id = $1",
            [id]
        );

        if (project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Authorization
        if (project.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this project"
            });
        }

        // Update Project
        const updatedProject = await pool.query(
            `UPDATE projects
             SET title = $1,
                 description = $2,
                 tech_stack = $3
             WHERE id = $4
             RETURNING *`,
            [title, description, tech_stack, id]
        );

        res.status(200).json({
            success: true,
            message: "Project Updated Successfully",
            project: updatedProject.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
module.exports = {
    createProjectController,
    getAllProjectsController,
    getMyProjectsController,
    deleteProjectController,
    updateProjectController
};