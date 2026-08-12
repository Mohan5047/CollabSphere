 const express = require("express");

const router = express.Router();

const {
    enrollUser,
    getAllEnrollments,
    getUserEnrollments
} = require("../controllers/enrollmentController");

router.get("/", getAllEnrollments);

router.get("/user/:userId", getUserEnrollments);

router.post("/", enrollUser);

module.exports = router;