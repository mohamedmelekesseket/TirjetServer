import express from "express";
import multer from "multer";
import { protect, adminOnly, vendorOrAdmin } from "../middlewares/auth.middleware.js";

import {
  getAllCultures,
  getCulturesByType,
  getCultureById,
  getMyCultures,
  createCulture,
  createCultureByAdmin,
  createCultureForVendor,
  updateCulture,
  approveCulture,
  suspendCulture,
  featureCulture,
  deleteCulture,
} from "../controllers/Cultureamazigh.controller.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", getAllCultures);
router.get("/type/:type", getCulturesByType);

// ── Vendor (must be BEFORE /:id) ──────────────────────────────────────────────
router.get("/mine", protect, getMyCultures);

// ── Admin-only (must be BEFORE /:id so Express doesn't treat "admin" as an id) ─
// Admin publishes as himself (host = admin, auto-approved)
router.post("/admin/create",     protect, adminOnly, upload.array("images", 10), createCultureByAdmin);
// Admin publishes on behalf of a vendor (host = vendor)
router.post("/admin/for-vendor", protect, adminOnly, upload.array("images", 10), createCultureForVendor);

router.patch("/:id/approve",  protect, adminOnly, approveCulture);
router.patch("/:id/suspend",  protect, adminOnly, suspendCulture);
router.patch("/:id/feature",  protect, adminOnly, featureCulture);

// ── Single resource ───────────────────────────────────────────────────────────
router.get("/:id",    getCultureById);
router.post("/",      protect, vendorOrAdmin, upload.array("images", 10), createCulture);
router.put("/:id",    protect, vendorOrAdmin, upload.array("images", 10), updateCulture);
router.delete("/:id", protect, deleteCulture);

export default router;