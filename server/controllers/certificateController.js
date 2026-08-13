 const pool = require("../config/db");
const crypto = require("crypto");

// ==========================================
// GENERATE CERTIFICATE
// ==========================================

const generateCertificate = async (req, res) => {
    try {
        const { user_id, course_id } = req.body;

        // Validation
        if (!user_id || !course_id) {
            return res.status(400).json({
                success: false,
                message: "user_id and course_id are required"
            });
        }

        // Check whether user exists
        const userResult = await pool.query(
            `SELECT id, full_name, email
             FROM users
             WHERE id = $1`,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check whether course exists
        const courseResult = await pool.query(
            `SELECT id, title
             FROM courses
             WHERE id = $1`,
            [course_id]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check whether certificate already exists
        const existingCertificate = await pool.query(
            `SELECT *
             FROM certificates
             WHERE user_id = $1
             AND course_id = $2`,
            [user_id, course_id]
        );

        if (existingCertificate.rows.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Certificate already exists",
                data: existingCertificate.rows[0]
            });
        }

        // Generate unique certificate number
        const certificateNumber =
            "COLLAB-" +
            crypto.randomBytes(6)
                .toString("hex")
                .toUpperCase();

        // Insert certificate
        const result = await pool.query(
            `INSERT INTO certificates
            (
                user_id,
                course_id,
                certificate_number
            )
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                user_id,
                course_id,
                certificateNumber
            ]
        );

        res.status(201).json({
            success: true,
            message: "Certificate generated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "GENERATE CERTIFICATE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// ==========================================
// GET ALL CERTIFICATES
// ==========================================

const getAllCertificates = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                cert.id,
                cert.user_id,
                cert.course_id,
                cert.certificate_number,
                cert.issued_at,
                u.full_name,
                u.email,
                c.title AS course_title
            FROM certificates cert

            JOIN users u
                ON cert.user_id = u.id

            JOIN courses c
                ON cert.course_id = c.id

            ORDER BY cert.issued_at DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "GET ALL CERTIFICATES ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// ==========================================
// GET USER CERTIFICATES
// ==========================================

const getUserCertificates = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(`
            SELECT
                cert.id,
                cert.user_id,
                cert.course_id,
                cert.certificate_number,
                cert.issued_at,
                c.title AS course_title,
                u.full_name,
                u.email
            FROM certificates cert

            JOIN courses c
                ON cert.course_id = c.id

            JOIN users u
                ON cert.user_id = u.id

            WHERE cert.user_id = $1

            ORDER BY cert.issued_at DESC
        `, [userId]);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "GET USER CERTIFICATES ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// ==========================================
// GET CERTIFICATE BY ID
// ==========================================

const getCertificateById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                cert.id,
                cert.user_id,
                cert.course_id,
                cert.certificate_number,
                cert.issued_at,
                u.full_name,
                u.email,
                c.title AS course_title
            FROM certificates cert

            JOIN users u
                ON cert.user_id = u.id

            JOIN courses c
                ON cert.course_id = c.id

            WHERE cert.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "GET CERTIFICATE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// ==========================================
// VERIFY CERTIFICATE
// ==========================================

const verifyCertificate = async (req, res) => {
    try {
        const { certificateNumber } = req.params;

        const result = await pool.query(`
            SELECT
                cert.id,
                cert.certificate_number,
                cert.issued_at,
                u.full_name,
                c.title AS course_title
            FROM certificates cert

            JOIN users u
                ON cert.user_id = u.id

            JOIN courses c
                ON cert.course_id = c.id

            WHERE cert.certificate_number = $1
        `, [certificateNumber]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: "Certificate not found"
            });
        }

        res.status(200).json({
            success: true,
            valid: true,
            message: "Certificate is valid",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(
            "VERIFY CERTIFICATE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    generateCertificate,
    getAllCertificates,
    getUserCertificates,
    getCertificateById,
    verifyCertificate
};