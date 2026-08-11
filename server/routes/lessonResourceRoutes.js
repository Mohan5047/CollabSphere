const express = require("express");

const router = express.Router();

const {
    getAllResources,
    getResourceById,
    getResourcesByLesson,
    addResource,
    updateResource,
    deleteResource
} = require("../controllers/lessonResourceController");

// GET all resources
router.get("/", getAllResources);

// GET resources by lesson
router.get("/lesson/:lessonId", getResourcesByLesson);

// GET resource by ID
router.get("/:id", getResourceById);

// ADD resource
router.post("/", addResource);

// UPDATE resource
router.put("/:id", updateResource);

// DELETE resource
router.delete("/:id", deleteResource);

module.exports = router;