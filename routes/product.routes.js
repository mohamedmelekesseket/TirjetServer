import express from "express";
import {
  getAllProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  approveProduct,
  deleteProduct,
  createProductForVendor,
  suspendProduct,
} from "../controllers/product.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireVendor } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// GET  /api/products              — public listing with filters
router.get("/", getAllProducts);

// GET  /api/products/mine         — artisan's own products (Vendor)
router.get("/mine", protect, requireVendor, getMyProducts);

// GET  /api/products/:id          — single product
router.get("/:id", getProductById);

// POST /api/products              — create product (Vendor)
router.post("/", protect, requireVendor, upload.array("images", 8), createProduct);

// PUT  /api/products/:id          — update product (Vendor | Admin)
router.put("/:id", protect, upload.array("images", 8), updateProduct);

// PATCH /api/products/:id/approve — approve product (Admin)
router.patch("/:id/approve", protect, requireAdmin, approveProduct);

// DELETE /api/products/:id        — delete product (Vendor | Admin)
router.delete("/:id", protect, deleteProduct);



// POST /api/products/admin/for-vendor  — admin creates product on behalf of a vendor
router.post(
  "/admin/for-vendor",
  protect,
  requireAdmin,
  upload.array("images", 8),createProductForVendor
);

// PATCH /api/products/:id/suspend  — suspend/unsuspend (Admin)
router.patch("/:id/suspend", protect, requireAdmin, suspendProduct);
export default router;