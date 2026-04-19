import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
  seedCategories,
  getCategoriesGrouped,
  addLevel4,
  deleteLevel4,
} from "../controllers/Category.controller.js";

// import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin only — uncomment middleware when ready
router.post("/", /* protect, adminOnly, */ createCategory);
router.put("/:id", /* protect, adminOnly, */ updateCategory);
router.delete("/:id", /* protect, adminOnly, */ deleteCategory);

// Subcategories
router.post("/:id/subcategories", /* protect, adminOnly, */ addSubcategory);
router.delete("/:id/subcategories/:subId", /* protect, adminOnly, */ deleteSubcategory);

// Seed default categories (run once)
router.post("/seed/defaults", /* protect, adminOnly, */ seedCategories);

router.get("/grouped", getCategoriesGrouped);
router.post("/:id/subcategories/:subId/subcategories/:subSubId/subcategories", addLevel4);
router.delete("/:id/subcategories/:subId/subcategories/:subSubId/subcategories/:itemId", deleteLevel4);

export default router;