const express = require("express");
const router = express.Router();

// Import Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Import Controller
const {
    createProjectController,
    getAllProjectsController,
    getMyProjectsController,
    deleteProjectController,
    updateProjectController
} = require("../controllers/projectController");
// Create Project API
router.post("/", authMiddleware, createProjectController);

// Get All Projects API
router.get("/", authMiddleware, getAllProjectsController);
router.get("/my-projects", authMiddleware, getMyProjectsController);
router.delete("/:id", authMiddleware, deleteProjectController);
router.put("/:id", authMiddleware, updateProjectController);
module.exports = router;