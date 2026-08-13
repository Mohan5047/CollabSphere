 const express = require("express");

const router = express.Router();

const {
    generateCertificate,
    getAllCertificates,
    getUserCertificates,
    getCertificateById,
    verifyCertificate
} = require("../controllers/certificateController");


// Generate certificate
router.post("/", generateCertificate);


// Get all certificates
router.get("/", getAllCertificates);


// Get certificates of a user
router.get("/user/:userId", getUserCertificates);
router.get(
    "/verify/:certificateNumber",
    verifyCertificate
);

// Get certificate by ID
router.get("/:id", getCertificateById);


// Verify certificate number
 


module.exports = router;