const express = require("express");
const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    createTask,
    getTeamTasks,
    getTaskById,
    updateTaskStatus,
    assignTask,
    deleteTask
} = require("../controllers/taskController");

router.post(
    "/",
    authMiddleware,
    createTask
);

router.get(
    "/team/:teamId",
    authMiddleware,
    getTeamTasks
);

router.get(
    "/:taskId",
    authMiddleware,
    getTaskById
);

router.put(
    "/:taskId/status",
    authMiddleware,
    updateTaskStatus
);

router.put(
    "/:taskId/assign",
    authMiddleware,
    assignTask
);

router.delete(
    "/:taskId",
    authMiddleware,
    deleteTask
);

module.exports = router;