const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

// ==========================================
// CHECK TEAM ACCESS
// ==========================================

const checkTeamAccess = async (teamId, userId) => {
    const result = await pool.query(
        `SELECT t.id
         FROM teams t
         INNER JOIN projects p
            ON t.project_id = p.id
         WHERE t.id = $1
         AND (
            p.owner_id = $2
            OR EXISTS (
                SELECT 1
                FROM team_members tm
                WHERE tm.team_id = t.id
                AND tm.user_id = $2
            )
         )`,
        [teamId, userId]
    );

    return result.rows.length > 0;
};


// ==========================================
// UPLOAD FILE
// ==========================================

const uploadFile = async (req, res) => {
    try {
       const {
    team_id
} = req.body || {};
        const userId = Number(req.user.id);

        if (!team_id) {
            return res.status(400).json({
                success: false,
                message: "team_id is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file"
            });
        }

        const hasAccess = await checkTeamAccess(
            team_id,
            userId
        );

        if (!hasAccess) {
            // Remove uploaded file if access is denied
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(403).json({
                success: false,
                message:
                    "You are not a member of this team"
            });
        }

        const result = await pool.query(
            `INSERT INTO files
            (
                team_id,
                uploaded_by,
                original_name,
                stored_name,
                file_path,
                mime_type,
                file_size
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                team_id,
                userId,
                req.file.originalname,
                req.file.filename,
                req.file.path,
                req.file.mimetype,
                req.file.size
            ]
        );

        res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            data: result.rows[0]
        });

    } catch (error) {
    console.error("UPLOAD FILE ERROR:", error);

    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
        success: false,
        message: error.message,
        error: error.code || "UNKNOWN_ERROR"
    });
    }
};


// ==========================================
// GET TEAM FILES
// ==========================================

const getTeamFiles = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = Number(req.user.id);

        const hasAccess = await checkTeamAccess(
            teamId,
            userId
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not a member of this team"
            });
        }

        const result = await pool.query(
            `SELECT
                f.id,
                f.team_id,
                f.original_name,
                f.mime_type,
                f.file_size,
                f.created_at,
                f.uploaded_by,
                u.full_name AS uploaded_by_name
             FROM files f
             LEFT JOIN users u
                ON f.uploaded_by = u.id
             WHERE f.team_id = $1
             ORDER BY f.created_at DESC`,
            [teamId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("GET FILES ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// DOWNLOAD FILE
// ==========================================

const downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = Number(req.user.id);

        const result = await pool.query(
            `SELECT
                f.*,
                t.id AS team_id
             FROM files f
             INNER JOIN teams t
                ON f.team_id = t.id
             WHERE f.id = $1`,
            [fileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const file = result.rows[0];

        const hasAccess = await checkTeamAccess(
            file.team_id,
            userId
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({
                success: false,
                message:
                    "File no longer exists on server"
            });
        }

        res.download(
            path.resolve(file.file_path),
            file.original_name
        );

    } catch (error) {
        console.error(
            "DOWNLOAD FILE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ==========================================
// DELETE FILE
// ==========================================

const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = Number(req.user.id);

        const result = await pool.query(
            `SELECT
                f.*,
                p.owner_id
             FROM files f
             INNER JOIN teams t
                ON f.team_id = t.id
             INNER JOIN projects p
                ON t.project_id = p.id
             WHERE f.id = $1`,
            [fileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const file = result.rows[0];

        // Only uploader or project owner can delete
        if (
            Number(file.uploaded_by) !== userId &&
            Number(file.owner_id) !== userId
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to delete this file"
            });
        }

        await pool.query(
            `DELETE FROM files
             WHERE id = $1`,
            [fileId]
        );

        if (
            file.file_path &&
            fs.existsSync(file.file_path)
        ) {
            fs.unlinkSync(file.file_path);
        }

        res.status(200).json({
            success: true,
            message:
                "File deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE FILE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


module.exports = {
    uploadFile,
    getTeamFiles,
    downloadFile,
    deleteFile
};