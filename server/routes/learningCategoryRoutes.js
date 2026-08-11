 const express = require("express");

const router = express.Router();

const {

    getAllCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory

} = require("../controllers/learningCategoryController");

router.get("/", getAllCategories);

router.get("/:id", getCategoryById);

router.post("/", addCategory);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);

module.exports = router;