const express = require("express");

const router = express.Router();

const {
    submitQuiz,
    getUserAttempts
} = require("../controllers/quizAttemptController");

router.post("/submit", submitQuiz);
router.get("/user/:userId", getUserAttempts);
module.exports = router;