const pool = require("../config/db");

// =========================
// Apply to Project Controller
// =========================
const applyProjectController = async (req, res) => {
    try {

        const { project_id } = req.body;

        // Validation
        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required"
            });
        }

        // Check if project exists
        const project = await pool.query(
            "SELECT * FROM projects WHERE id = $1",
            [project_id]
        );

        if (project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Owner cannot apply to own project
        if (project.rows[0].owner_id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot apply to your own project"
            });
        }

        // Check duplicate application
        const existingApplication = await pool.query(
            `SELECT * FROM applications
             WHERE project_id = $1 AND user_id = $2`,
            [project_id, req.user.id]
        );

        if (existingApplication.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You have already applied to this project"
            });
        }

        // Create application
        const application = await pool.query(
            `INSERT INTO applications (project_id, user_id)
             VALUES ($1, $2)
             RETURNING *`,
            [project_id, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: "Application Submitted Successfully",
            application: application.rows[0]
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
// Get Applications Controller
// =========================
const getApplicationsController = async (req, res) => {
    try {

        const applications = await pool.query(
            `SELECT
                applications.id,
                applications.status,
                applications.applied_at,
                users.id AS user_id,
                users.full_name,
                users.email,
                projects.id AS project_id,
                projects.title
             FROM applications
             INNER JOIN users
                ON applications.user_id = users.id
             INNER JOIN projects
                ON applications.project_id = projects.id
             WHERE projects.owner_id = $1
             ORDER BY applications.applied_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            totalApplications: applications.rows.length,
            applications: applications.rows
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
// Accept Application Controller
// =========================
const acceptApplicationController = async (req, res) => {
    try {

        const { applicationId } = req.params;

        // Check application
        const application = await pool.query(
            "SELECT * FROM applications WHERE id = $1",
            [applicationId]
        );

        if (application.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Update application status
        await pool.query(
            "UPDATE applications SET status = 'accepted' WHERE id = $1",
            [applicationId]
        );

        // Find team for this project
        const team = await pool.query(
            "SELECT * FROM teams WHERE project_id = $1",
            [application.rows[0].project_id]
        );

        if (team.rows.length > 0) {
            // Add user to team
            await pool.query(
                `INSERT INTO team_members (team_id, user_id)
                 VALUES ($1, $2)
                 ON CONFLICT (team_id, user_id) DO NOTHING`,
                [
                    team.rows[0].id,
                    application.rows[0].user_id
                ]
            );
        }

        res.status(200).json({
            success: true,
            message: "Application Accepted Successfully"
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
// Reject Application Controller
// =========================
const rejectApplicationController = async (req, res) => {
    try {

        const { applicationId } = req.params;

        // Check application
        const application = await pool.query(
            "SELECT * FROM applications WHERE id = $1",
            [applicationId]
        );

        if (application.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Update status
        await pool.query(
            "UPDATE applications SET status = 'rejected' WHERE id = $1",
            [applicationId]
        );

        res.status(200).json({
            success: true,
            message: "Application Rejected Successfully"
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
    applyProjectController,
    getApplicationsController,
    acceptApplicationController,
    rejectApplicationController
};
