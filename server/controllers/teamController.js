 const pool = require("../config/db");

// ==========================================
// CREATE TEAM
// ==========================================

const createTeam = async (req, res) => {
    try {
        const {
            project_id,
            team_name
        } = req.body;

        const userId =
            Number(req.user.id);

        if (
            !project_id ||
            !team_name ||
            !team_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "project_id and team_name are required"
            });
        }

        // Check project ownership
        const project =
            await pool.query(
                `SELECT id, owner_id
                 FROM projects
                 WHERE id = $1`,
                [project_id]
            );

        if (project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Project not found"
            });
        }

        if (
            Number(project.rows[0].owner_id) !==
            userId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the project owner can create a team"
            });
        }

        // Prevent multiple teams for same project
        const existingTeam =
            await pool.query(
                `SELECT id
                 FROM teams
                 WHERE project_id = $1`,
                [project_id]
            );

        if (existingTeam.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "A team already exists for this project"
            });
        }

        const result =
            await pool.query(
                `INSERT INTO teams
                (project_id, team_name)
                VALUES ($1, $2)
                RETURNING *`,
                [
                    project_id,
                    team_name.trim()
                ]
            );

        res.status(201).json({
            success: true,
            message:
                "Team created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "CREATE TEAM ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// GET ALL TEAMS
// ==========================================

const getAllTeams = async (
    req,
    res
) => {
    try {
        const result =
            await pool.query(`
                SELECT
                    t.id,
                    t.project_id,
                    t.team_name,
                    t.created_at,
                    COUNT(tm.id)::int
                        AS member_count
                FROM teams t

                LEFT JOIN team_members tm
                    ON t.id = tm.team_id

                GROUP BY
                    t.id,
                    t.project_id,
                    t.team_name,
                    t.created_at

                ORDER BY
                    t.created_at DESC
            `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "GET TEAMS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// GET TEAM BY ID
// ==========================================

const getTeamById = async (
    req,
    res
) => {
    try {
        const {
            teamId
        } = req.params;

        const teamResult =
            await pool.query(
                `SELECT *
                 FROM teams
                 WHERE id = $1`,
                [teamId]
            );

        if (
            teamResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Team not found"
            });
        }

        const membersResult =
            await pool.query(
                `SELECT
                    tm.id AS member_id,
                    tm.user_id,
                    u.full_name,
                    u.email,
                    tm.role,
                    tm.joined_at

                 FROM team_members tm

                 INNER JOIN users u
                    ON tm.user_id = u.id

                 WHERE tm.team_id = $1

                 ORDER BY tm.joined_at ASC`,
                [teamId]
            );

        res.status(200).json({
            success: true,
            data: {
                team:
                    teamResult.rows[0],
                members:
                    membersResult.rows
            }
        });

    } catch (error) {
        console.error(
            "GET TEAM ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// ADD MEMBER
// ==========================================

const addTeamMember = async (
    req,
    res
) => {
    try {
        const {
            team_id,
            user_id
        } = req.body;

        const currentUserId =
            Number(req.user.id);

        if (
            !team_id ||
            !user_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "team_id and user_id are required"
            });
        }

        // Check team + project owner
        const team =
            await pool.query(
                `SELECT
                    t.id,
                    t.project_id,
                    p.owner_id

                 FROM teams t

                 INNER JOIN projects p
                    ON t.project_id = p.id

                 WHERE t.id = $1`,
                [team_id]
            );

        if (team.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Team not found"
            });
        }

        // Only project owner
        if (
            Number(
                team.rows[0].owner_id
            ) !== currentUserId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the project owner can add team members"
            });
        }

        // Check user
        const user =
            await pool.query(
                `SELECT id, full_name, email
                 FROM users
                 WHERE id = $1`,
                [user_id]
            );

        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "User not found"
            });
        }

        // Check duplicate
        const existing =
            await pool.query(
                `SELECT id
                 FROM team_members
                 WHERE team_id = $1
                 AND user_id = $2`,
                [team_id, user_id]
            );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "User is already a member of this team"
            });
        }

        const result =
            await pool.query(
                `INSERT INTO team_members
                (team_id, user_id)
                VALUES ($1, $2)
                RETURNING *`,
                [team_id, user_id]
            );

        res.status(201).json({
            success: true,
            message:
                "Member added successfully",
            data:
                result.rows[0]
        });

    } catch (error) {
        console.error(
            "ADD TEAM MEMBER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// REMOVE MEMBER
// ==========================================

const removeTeamMember = async (
    req,
    res
) => {
    try {
        const {
            teamId,
            userId
        } = req.params;

        const currentUserId =
            Number(req.user.id);

        // Check owner
        const team =
            await pool.query(
                `SELECT
                    t.id,
                    p.owner_id

                 FROM teams t

                 INNER JOIN projects p
                    ON t.project_id = p.id

                 WHERE t.id = $1`,
                [teamId]
            );

        if (team.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Team not found"
            });
        }

        if (
            Number(
                team.rows[0].owner_id
            ) !== currentUserId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the project owner can remove team members"
            });
        }

        // Don't remove project owner if present
        if (
            Number(userId) ===
            currentUserId
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Project owner cannot be removed from the team"
            });
        }

        const result =
            await pool.query(
                `DELETE FROM team_members
                 WHERE team_id = $1
                 AND user_id = $2
                 RETURNING *`,
                [teamId, userId]
            );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Team member not found"
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Member removed successfully",
            data:
                result.rows[0]
        });

    } catch (error) {
        console.error(
            "REMOVE TEAM MEMBER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// ASSIGN TEAM LEAD
// ==========================================

const assignTeamLead = async (
    req,
    res
) => {
    const client =
        await pool.connect();

    try {
        const {
            teamId,
            userId
        } = req.params;

        const currentUserId =
            Number(req.user.id);

        // Check team owner
        const team =
            await client.query(
                `SELECT
                    t.id,
                    p.owner_id

                 FROM teams t

                 INNER JOIN projects p
                    ON t.project_id = p.id

                 WHERE t.id = $1`,
                [teamId]
            );

        if (team.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Team not found"
            });
        }

        if (
            Number(
                team.rows[0].owner_id
            ) !== currentUserId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the project owner can assign a team lead"
            });
        }

        // Check member
        const member =
            await client.query(
                `SELECT id
                 FROM team_members
                 WHERE team_id = $1
                 AND user_id = $2`,
                [teamId, userId]
            );

        if (member.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "User is not a member of this team"
            });
        }

        await client.query(
            "BEGIN"
        );

        // Remove old lead
        await client.query(
            `UPDATE team_members
             SET role = 'member'
             WHERE team_id = $1
             AND role = 'team_lead'`,
            [teamId]
        );

        // Assign new lead
        const result =
            await client.query(
                `UPDATE team_members
                 SET role = 'team_lead'
                 WHERE team_id = $1
                 AND user_id = $2
                 RETURNING *`,
                [teamId, userId]
            );

        await client.query(
            "COMMIT"
        );

        res.status(200).json({
            success: true,
            message:
                "Team lead assigned successfully",
            data:
                result.rows[0]
        });

    } catch (error) {
        await client.query(
            "ROLLBACK"
        );

        console.error(
            "ASSIGN TEAM LEAD ERROR:",
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


module.exports = {
    createTeam,
    getAllTeams,
    getTeamById,
    addTeamMember,
    removeTeamMember,
    assignTeamLead
};