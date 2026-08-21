const pool = require("../config/db");
// ==========================================
// GET CHAT USERS / TEAMMATES
// ==========================================

const getChatUsers = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `
            SELECT DISTINCT
                u.id,
                u.full_name,
                u.email,
                tm.role,
                t.id AS team_id,
                t.team_name
            FROM team_members tm
            JOIN users u
                ON tm.user_id = u.id
            JOIN teams t
                ON tm.team_id = t.id
            WHERE tm.team_id IN (
                SELECT team_id
                FROM team_members
                WHERE user_id = $1
            )
            AND u.id != $1
            ORDER BY u.full_name ASC
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("GET CHAT USERS ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// GET CONVERSATION BETWEEN TWO USERS
const getConversation = async (req, res) => {
    try {
        const { user1, user2 } = req.params;

        const result = await pool.query(
            `SELECT
                m.id,
                m.sender_id,
                m.receiver_id,
                m.message,
                m.is_read,
                m.created_at,
                s.full_name AS sender_name,
                r.full_name AS receiver_name
             FROM messages m
             JOIN users s ON m.sender_id = s.id
             JOIN users r ON m.receiver_id = r.id
             WHERE
                (m.sender_id = $1 AND m.receiver_id = $2)
                OR
                (m.sender_id = $2 AND m.receiver_id = $1)
             ORDER BY m.created_at ASC`,
            [user1, user2]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("GET CONVERSATION ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getConversation,
    getChatUsers
};