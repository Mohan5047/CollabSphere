 const express = require("express");

const router = express.Router();

const {
    getUserDashboard
} = require("../controllers/dashboardController");

router.get("/user/:userId", getUserDashboard);

module.exports = router;