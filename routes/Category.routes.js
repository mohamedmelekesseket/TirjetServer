import express from "express";
import {
  uploadCategoryImage,
  getCategories,
  getCategoryById,
  getCategoriesGrouped,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  addSubSubcategory,
  updateSubSubcategory,
  deleteSubSubcategory,
  addLevel4,
  updateLevel4,
  deleteLevel4,
  seedCategories,
} from "../controllers/Category.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// ── Static paths FIRST — before any :param routes ─────────────────────────────
router.get("/grouped",       getCategoriesGrouped);
router.post("/seed/defaults", seedCategories);
router.post("/upload-image", upload.single("image"), uploadCategoryImage);

// ── Root CRUD ─────────────────────────────────────────────────────────────────
router.get("/",     getCategories);
router.post("/",    createCategory);
router.get("/:id",  getCategoryById);
router.put("/:id",  updateCategory);
router.delete("/:id", deleteCategory);

// ── L2 ────────────────────────────────────────────────────────────────────────
router.post("/:id/subcategories",          addSubcategory);
router.put("/:id/subcategories/:subId",    updateSubcategory);
router.delete("/:id/subcategories/:subId", deleteSubcategory);

// ── L3 ────────────────────────────────────────────────────────────────────────
router.post("/:id/subcategories/:subId/subcategories",             addSubSubcategory);
router.put("/:id/subcategories/:subId/subcategories/:subSubId",    updateSubSubcategory);
router.delete("/:id/subcategories/:subId/subcategories/:subSubId", deleteSubSubcategory);

// ── L4 ────────────────────────────────────────────────────────────────────────
router.post("/:id/subcategories/:subId/subcategories/:subSubId/subcategories",             addLevel4);
router.put("/:id/subcategories/:subId/subcategories/:subSubId/subcategories/:itemId",      updateLevel4);
router.delete("/:id/subcategories/:subId/subcategories/:subSubId/subcategories/:itemId",   deleteLevel4);

export default router;