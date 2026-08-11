const express = require("express");

const router = express.Router();

const {
    getAllLessons,
    getLessonById,
    getLessonsByModule,
    addLesson,
    updateLesson,
    deleteLesson
} = require("../controllers/lessonController");

// GET all lessons
router.get("/", getAllLessons);

// GET lessons belonging to a module
router.get("/module/:moduleId", getLessonsByModule);

// GET lesson by ID
router.get("/:id", getLessonById);

// ADD lesson
router.post("/", addLesson);

// UPDATE lesson
router.put("/:id", updateLesson);

// DELETE lesson
router.delete("/:id", deleteLesson);

module.exports = router;