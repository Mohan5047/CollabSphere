 const express = require("express");

const router = express.Router();

const {
    getAllTracks,
    getTrackById,
    addTrack,
    updateTrack,
    deleteTrack
} = require("../controllers/learningTrackController");


router.get("/", getAllTracks);

router.get("/:id", getTrackById);

router.post("/", addTrack);

router.put("/:id", updateTrack);

router.delete("/:id", deleteTrack);


module.exports = router;