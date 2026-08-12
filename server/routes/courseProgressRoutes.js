const express = require("express");

const router = express.Router();

const {
    getCourseProgress
} = require("../controllers/courseProgressController");

router.get(
    "/user/:userId/course/:courseId",
    getCourseProgress
);

module.exports = router;