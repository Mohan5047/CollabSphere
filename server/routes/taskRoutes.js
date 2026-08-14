const express = require("express");

const router = express.Router();

const {
    createTask,
    getTeamTasks,
    getTaskById,
    updateTaskStatus,
    assignTask,
    deleteTask
} = require("../controllers/taskController");

router.post("/", createTask);

router.get("/team/:teamId", getTeamTasks);

router.get("/:taskId", getTaskById);

router.put("/:taskId/status", updateTaskStatus);

router.put("/:taskId/assign", assignTask);

router.delete("/:taskId", deleteTask);

module.exports = router;