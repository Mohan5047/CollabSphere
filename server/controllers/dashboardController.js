const pool = require("../config/db");

// =========================
// Dashboard Controller
// =========================
const dashboardController = async (req, res) => {
    try {

        // Total Projects
        const totalProjects = await pool.query(
            "SELECT COUNT(*) FROM projects"
        );

        // My Projects
        const myProjects = await pool.query(
            "SELECT COUNT(*) FROM projects WHERE owner_id = $1",
            [req.user.id]
        );

        // Total Teams
        const totalTeams = await pool.query(
            "SELECT COUNT(*) FROM teams"
        );

        // Pending Applications
        const pendingApplications = await pool.query(
            "SELECT COUNT(*) FROM applications WHERE status = 'pending'"
        );

        res.status(200).json({
            success: true,
            dashboard: {
                totalProjects: Number(totalProjects.rows[0].count),
                myProjects: Number(myProjects.rows[0].count),
                totalTeams: Number(totalTeams.rows[0].count),
                pendingApplications: Number(pendingApplications.rows[0].count)
            }
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
    dashboardController
};