import express from "express";
import { Category } from "./CategoryController";

const router = express.Router();
router.post("/create", Category.createCategoryWithSubCategory);
router.get("/get", Category.getAllCategories);
router.delete("/delete/:id", Category.deleteCategoriesById);
router.put("/update/:id", Category.updateCategoryWithSubCategory);
router.post("/update/all", Category.updateAllCategory);

export const CategoryRoute = router;
