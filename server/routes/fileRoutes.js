const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    uploadFile,
    getTeamFiles,
    downloadFile,
    deleteFile
} = require("../controllers/fileController");

// ==========================================
// UPLOAD DIRECTORY
// ==========================================

const uploadDir = path.join(
    __dirname,
    "../uploads"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${Math.round(
                Math.random() * 1E9
            )}${path.extname(file.originalname)}`;

        cb(null, uniqueName);
    }
});

// ==========================================
// MULTER
// ==========================================

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// ==========================================
// ROUTES
// ==========================================

// Upload file
router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadFile
);

// Get team files
router.get(
    "/team/:teamId",
    authMiddleware,
    getTeamFiles
);

// Download file
router.get(
    "/:fileId/download",
    authMiddleware,
    downloadFile
);

// Delete file
router.delete(
    "/:fileId",
    authMiddleware,
    deleteFile
);

module.exports = router;