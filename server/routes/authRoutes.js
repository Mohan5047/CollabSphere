
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    testController,
    registerController,
    loginController,
    protectedController,
    updateProfileController
} = require("../controllers/authController");
// Test API
router.get("/test", testController);
router.post("/login", loginController);
// Register API
router.post("/register", registerController);
// Update Profile API
router.put("/profile", authMiddleware, updateProfileController);
router.get("/profile", authMiddleware, protectedController);
module.exports = router;