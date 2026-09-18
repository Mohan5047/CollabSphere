const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const { logActivity } = require("../utils/activityLogger");

// ==========================================
// CHECK TEAM ACCESS
// ==========================================

const checkTeamAccess = async (teamId, userId) => {
    const numericTeamId = Number(teamId);
    if (!numericTeamId || isNaN(numericTeamId)) {
        return false;
    }

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
        [numericTeamId, userId]
    );

    return result.rows.length > 0;
};


// ==========================================
// UPLOAD FILE
// ==========================================

const uploadFile = async (req, res) => {
    try {
        const { team_id } = req.body || {};
        const userId = Number(req.user.id);

        if (!team_id || isNaN(Number(team_id))) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: "team_id is required and must be a valid number"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file"
            });
        }

        const numericTeamId = Number(team_id);

        // Check if team exists
        const teamCheck = await pool.query(
            "SELECT id FROM teams WHERE id = $1",
            [numericTeamId]
        );

        if (teamCheck.rows.length === 0) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        const hasAccess = await checkTeamAccess(
            numericTeamId,
            userId
        );

        if (!hasAccess) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(403).json({
                success: false,
                message: "You are not a member of this team"
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
                numericTeamId,
                userId,
                req.file.originalname,
                req.file.filename,
                req.file.path,
                req.file.mimetype,
                req.file.size
            ]
        );

        const savedFile = result.rows[0];

        await logActivity({
            userId,
            activityType: "FILE_UPLOADED",
            description: `Uploaded file "${req.file.originalname}"`,
            teamId: numericTeamId
        });

        res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            data: savedFile
        });

    } catch (error) {
        console.error("UPLOAD FILE ERROR:", error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: "Server Error"
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

        if (!teamId || isNaN(Number(teamId))) {
            return res.status(400).json({
                success: false,
                message: "Invalid team ID"
            });
        }

        const numericTeamId = Number(teamId);

        // Check if team exists
        const teamCheck = await pool.query(
            "SELECT id FROM teams WHERE id = $1",
            [numericTeamId]
        );

        if (teamCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        const hasAccess = await checkTeamAccess(
            numericTeamId,
            userId
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this team"
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
            [numericTeamId]
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

        if (!fileId || isNaN(Number(fileId))) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID"
            });
        }

        const numericFileId = Number(fileId);

        const result = await pool.query(
            `SELECT
                f.*,
                t.id AS team_id
             FROM files f
             INNER JOIN teams t
                ON f.team_id = t.id
             WHERE f.id = $1`,
            [numericFileId]
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

        if (!file.file_path || !fs.existsSync(file.file_path)) {
            return res.status(404).json({
                success: false,
                message: "File no longer exists on server"
            });
        }

        res.download(
            path.resolve(file.file_path),
            file.original_name
        );

    } catch (error) {
        console.error("DOWNLOAD FILE ERROR:", error);

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

        if (!fileId || isNaN(Number(fileId))) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID"
            });
        }

        const numericFileId = Number(fileId);

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
            [numericFileId]
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
                message: "You do not have permission to delete this file"
            });
        }

        await pool.query(
            `DELETE FROM files
             WHERE id = $1`,
            [numericFileId]
        );

        if (file.file_path && fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
        }

        await logActivity({
            userId,
            activityType: "FILE_DELETED",
            description: `Deleted file "${file.original_name}"`,
            teamId: file.team_id,
            projectId: file.owner_id ? file.project_id : null
        });

        res.status(200).json({
            success: true,
            message: "File deleted successfully"
        });

    } catch (error) {
        console.error("DELETE FILE ERROR:", error);

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