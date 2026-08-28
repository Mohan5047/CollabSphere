 const pool = require("../config/db");

// ==========================================
// APPLY TO PROJECT
// ==========================================

const applyProjectController = async (req, res) => {
    try {
        const { project_id } = req.body;
        const userId = Number(req.user.id);

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required"
            });
        }

        // Check project
        const project = await pool.query(
            `SELECT id, owner_id, title
             FROM projects
             WHERE id = $1`,
            [project_id]
        );

        if (project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Owner cannot apply
        if (
            Number(project.rows[0].owner_id) ===
            userId
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot apply to your own project"
            });
        }

        // Check duplicate
        const existingApplication =
            await pool.query(
                `SELECT id, status
                 FROM applications
                 WHERE project_id = $1
                 AND user_id = $2`,
                [project_id, userId]
            );

        if (
            existingApplication.rows.length > 0
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "You have already applied to this project",
                status:
                    existingApplication.rows[0].status
            });
        }

        // Create application
        const application =
            await pool.query(
                `INSERT INTO applications
                (project_id, user_id)
                VALUES ($1, $2)
                RETURNING *`,
                [project_id, userId]
            );

        res.status(201).json({
            success: true,
            message:
                "Application Submitted Successfully",
            application:
                application.rows[0]
        });

    } catch (error) {
        console.error(
            "APPLY PROJECT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// GET APPLICATIONS FOR MY PROJECTS
// ==========================================

const getApplicationsController = async (
    req,
    res
) => {
    try {
        const userId = Number(req.user.id);

        const applications =
            await pool.query(
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
                    ON applications.project_id =
                       projects.id

                 WHERE projects.owner_id = $1

                 ORDER BY applications.applied_at DESC`,
                [userId]
            );

        res.status(200).json({
            success: true,
            totalApplications:
                applications.rows.length,
            applications:
                applications.rows
        });

    } catch (error) {
        console.error(
            "GET APPLICATIONS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// ACCEPT APPLICATION
// ==========================================

const acceptApplicationController =
    async (req, res) => {
        const client = await pool.connect();

        try {
            const {
                applicationId
            } = req.params;

            const userId =
                Number(req.user.id);

            await client.query("BEGIN");

            // Find application + project owner
            const application =
                await client.query(
                    `SELECT
                        a.id,
                        a.project_id,
                        a.user_id,
                        a.status,
                        p.owner_id,
                        p.title

                     FROM applications a

                     INNER JOIN projects p
                        ON a.project_id = p.id

                     WHERE a.id = $1`,
                    [applicationId]
                );

            if (
                application.rows.length === 0
            ) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "Application not found"
                });
            }

            const app =
                application.rows[0];

            // ONLY PROJECT OWNER CAN ACCEPT
            if (
                Number(app.owner_id) !==
                userId
            ) {
                await client.query("ROLLBACK");

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to accept this application"
                });
            }

            // Already accepted
            if (app.status === "accepted") {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Application is already accepted"
                });
            }

            // Cannot accept rejected application
            if (app.status === "rejected") {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Rejected application cannot be accepted"
                });
            }

            // Update application
            await client.query(
                `UPDATE applications
                 SET status = 'accepted'
                 WHERE id = $1`,
                [applicationId]
            );

            // Find project team
            const team =
                await client.query(
                    `SELECT id
                     FROM teams
                     WHERE project_id = $1
                     LIMIT 1`,
                    [app.project_id]
                );

            // Add applicant to team
            if (team.rows.length > 0) {
                await client.query(
                    `INSERT INTO team_members
                    (team_id, user_id)
                    VALUES ($1, $2)
                    ON CONFLICT
                    (team_id, user_id)
                    DO NOTHING`,
                    [
                        team.rows[0].id,
                        app.user_id
                    ]
                );
            }

            await client.query("COMMIT");

            res.status(200).json({
                success: true,
                message:
                    "Application Accepted Successfully"
            });

        } catch (error) {
            await client.query("ROLLBACK");

            console.error(
                "ACCEPT APPLICATION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server Error"
            });

        } finally {
            client.release();
        }
    };


// ==========================================
// REJECT APPLICATION
// ==========================================

const rejectApplicationController =
    async (req, res) => {
        try {
            const {
                applicationId
            } = req.params;

            const userId =
                Number(req.user.id);

            // Find application
            const application =
                await pool.query(
                    `SELECT
                        a.id,
                        a.status,
                        p.owner_id

                     FROM applications a

                     INNER JOIN projects p
                        ON a.project_id = p.id

                     WHERE a.id = $1`,
                    [applicationId]
                );

            if (
                application.rows.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Application not found"
                });
            }

            const app =
                application.rows[0];

            // ONLY PROJECT OWNER
            if (
                Number(app.owner_id) !==
                userId
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to reject this application"
                });
            }

            if (app.status === "rejected") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Application is already rejected"
                });
            }

            if (app.status === "accepted") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Accepted application cannot be rejected"
                });
            }

            await pool.query(
                `UPDATE applications
                 SET status = 'rejected'
                 WHERE id = $1`,
                [applicationId]
            );

            res.status(200).json({
                success: true,
                message:
                    "Application Rejected Successfully"
            });

        } catch (error) {
            console.error(
                "REJECT APPLICATION ERROR:",
                error
            );

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