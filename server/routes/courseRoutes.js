const express = require("express");

const router = express.Router();

const {
    getAllCourses,
    getCourseById,
    addCourse,
    updateCourse,
    deleteCourse
} = require("../controllers/courseController");

// GET all courses
router.get("/", getAllCourses);

// GET course by ID
router.get("/:id", getCourseById);

// POST new course
router.post("/", addCourse);

// PUT update course
router.put("/:id", updateCourse);

// DELETE course
router.delete("/:id", deleteCourse);

module.exports = router;