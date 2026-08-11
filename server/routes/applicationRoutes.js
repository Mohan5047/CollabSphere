const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    applyProjectController,
    getApplicationsController,
    acceptApplicationController,
    rejectApplicationController

} = require("../controllers/applicationController");
// Apply to Project
router.post("/", authMiddleware, applyProjectController);
router.get("/", authMiddleware, getApplicationsController);
router.put("/accept/:applicationId", authMiddleware, acceptApplicationController);
router.put("/reject/:applicationId", authMiddleware, rejectApplicationController);
module.exports = router;