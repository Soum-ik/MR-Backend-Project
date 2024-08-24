import express from 'express';
import { Category } from './CategoryController';


const router = express.Router();
router.post('/create', Category.createCategoryWithSubCategory)
router.get('/get', Category.getAllCategories)
router.delete('/delete/:id', Category.deleteCategoriesById)
router.put('/udpate/:id', Category.updateCategoryWithSubCategory)

export const CategoryRoute = router;