const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// =========================
// Test Controller
// =========================
const testController = (req, res) => {
    res.json({
        success: true,
        message: "Hello from Auth Controller 🎉"
    });
};

// =========================
// Register Controller
// =========================
const registerController = async (req, res) => {
    try {

        // 1. Get data from request
        const { full_name, email, password, role } = req.body;

        // 2. Validate input
        if (!full_name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // 3. Check if email already exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // 4. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Save user into database
        const newUser = await pool.query(
            `INSERT INTO users (full_name, email, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, full_name, email, role, created_at`,
            [full_name, email, hashedPassword, role]
        );

        // 6. Success response
        res.status(201).json({
            success: true,
            message: "User Registered Successfully",
            user: newUser.rows[0]
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
// Login Controller
// =========================
const loginController = async (req, res) => {
    try {

        // 1. Get email and password
        const { email, password } = req.body;

        // 2. Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required"
            });
        }

        // 3. Check if user exists
        const user = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        // 4. If user not found
        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // =========================
// Protected Controller
// =========================

// Compare password
const isMatch = await bcrypt.compare(
    password,
    user.rows[0].password
);

if (!isMatch) {
    return res.status(401).json({
        success: false,
        message: "Invalid Password"
    });
}
// Generate JWT Token
const token = jwt.sign(
    {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1d"
    }
);
        // 5. Temporary success response
       res.status(200).json({
    success: true,
    message: "Login Successful",
    token,
    user: {
        id: user.rows[0].id,
        full_name: user.rows[0].full_name,
        email: user.rows[0].email,
        role: user.rows[0].role
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
// =========================
// Protected Controller
// =========================
// =========================
// Protected Controller
// =========================
const protectedController = async (req, res) => {
    try {

        // Fetch logged-in user from database
        const user = await pool.query(
            `SELECT id, full_name, email, role, created_at
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        // If user not found
        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Success response
        res.status(200).json({
            success: true,
            message: "Profile Fetched Successfully",
            profile: user.rows[0]
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
// Update Profile Controller
// =========================
const updateProfileController = async (req, res) => {
    try {

        const { full_name } = req.body;

        if (!full_name) {
            return res.status(400).json({
                success: false,
                message: "Full Name is required"
            });
        }

        const updatedUser = await pool.query(
            `UPDATE users
             SET full_name = $1
             WHERE id = $2
             RETURNING id, full_name, email, role, created_at`,
            [full_name, req.user.id]
        );

        res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
            profile: updatedUser.rows[0]
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
// Export Controllers
// =========================
module.exports = {
    testController,
    registerController,
    loginController,
    protectedController,
    updateProfileController
};