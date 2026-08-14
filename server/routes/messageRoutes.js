const express = require("express");

const router = express.Router();

const {
    getConversation
} = require("../controllers/messageController");

router.get("/:user1/:user2", getConversation);

module.exports = router;