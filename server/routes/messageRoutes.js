const express = require("express");

const router = express.Router();

const {
    getConversation,
    getChatUsers
} = require("../controllers/messageController");
router.get("/users/:userId", getChatUsers);
router.get("/:user1/:user2", getConversation);

module.exports = router;