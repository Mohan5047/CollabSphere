const express = require("express");

const router = express.Router();

const {
    getAllQuestions,
    getQuestionsByQuiz,
    addQuestion
} = require("../controllers/quizQuestionController");

router.get("/", getAllQuestions);

router.get("/quiz/:quizId", getQuestionsByQuiz);

router.post("/", addQuestion);

module.exports = router;