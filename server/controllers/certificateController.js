const pool = require("../config/db");
const crypto = require("crypto");

const generateCertificate = async (req, res) => {
    try {
        const { user_id, course_id } = req.body;

        if (!user_id || !course_id) {
            return res.status(400).json({
                success: false,
                message: "user_id and course_id are required"
            });
        }

        // Check existing certificate
        const existing = await pool.query(
            `SELECT * FROM certificates
             WHERE user_id = $1 AND course_id = $2`,
            [user_id, course_id]
        );

        if (existing.rows.length > 0) {
            return res.json({
                success: true,
                message: "Certificate already exists",
                data: existing.rows[0]
            });
        }

        const certificateCode =
            "COLLAB-" +
            crypto.randomBytes(6).toString("hex").toUpperCase();

        const result = await pool.query(
            `INSERT INTO certificates
             (user_id, course_id, certificate_code)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [user_id, course_id, certificateCode]
        );

        res.status(201).json({
            success: true,
            message: "Certificate generated successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const getUserCertificates = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(`
            SELECT
                cert.id,
                cert.certificate_code,
                cert.issued_at,
                c.title AS course_title,
                u.full_name
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            JOIN users u ON cert.user_id = u.id
            WHERE cert.user_id = $1
            ORDER BY cert.issued_at DESC
        `, [userId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


module.exports = {
    generateCertificate,
    getUserCertificates
};