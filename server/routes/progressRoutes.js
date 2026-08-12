const express = require("express");

const router = express.Router();

const {
    getAllProgress,
    getUserProgress,
    updateProgress,
    deleteProgress
} = require("../controllers/progressController");

router.get("/", getAllProgress);

router.get("/user/:userId", getUserProgress);

router.post("/", updateProgress);

router.put("/", updateProgress);

router.delete("/:id", deleteProgress);

module.exports = router;