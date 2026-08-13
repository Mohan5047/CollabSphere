const express = require("express");

const router = express.Router();

const {
    generateCertificate,
    getUserCertificates
} = require("../controllers/certificateController");

router.post("/", generateCertificate);

router.get("/user/:userId", getUserCertificates);

module.exports = router;