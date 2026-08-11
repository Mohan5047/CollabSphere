const express = require("express");

const router = express.Router();

const {
    getAllModules,
    getModuleById,
    getModulesByCourse,
    addModule,
    updateModule,
    deleteModule
} = require("../controllers/moduleController");

// GET all modules
router.get("/", getAllModules);

// GET modules belonging to a course
router.get("/course/:courseId", getModulesByCourse);

// GET module by ID
router.get("/:id", getModuleById);

// ADD module
router.post("/", addModule);

// UPDATE module
router.put("/:id", updateModule);

// DELETE module
router.delete("/:id", deleteModule);

module.exports = router;