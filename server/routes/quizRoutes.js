const express = require("express");

const router = express.Router();

const {
    getAllQuizzes,
    getQuizById,
    addQuiz
} = require("../controllers/quizController");

router.get("/", getAllQuizzes);

router.get("/:id", getQuizById);

router.post("/", addQuiz);

module.exports = router;