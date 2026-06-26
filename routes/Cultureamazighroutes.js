import express from "express";
import multer from "multer";
import { protect, adminOnly, vendorOrAdmin } from "../middlewares/auth.middleware.js";
import {
  getAllCultures, getCulturesByType, getCultureById, getMyCultures,
  createCulture, createCultureByAdmin, createCultureForVendor,
  updateCulture, approveCulture, suspendCulture, featureCulture, deleteCulture,
} from "../controllers/Cultureamazigh.controller.js";

const router = express.Router();

// ── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB per file
});

const fields = upload.fields([
  { name: "images", maxCount: 8 },
  { name: "videos", maxCount: 5 },
]);

// ── Timeout middleware (video uploads need > 60s) ─────────────────────────────
const longTimeout = (req, res, next) => {
  req.setTimeout(300_000);  // 5 min
  res.setTimeout(300_000);
  next();
};

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",           getAllCultures);
router.get("/type/:type", getCulturesByType);

// ── Vendor (before /:id) ──────────────────────────────────────────────────────
router.get("/mine", protect, getMyCultures);

// ── Admin-only (before /:id) ──────────────────────────────────────────────────
router.post("/admin/create",     protect, adminOnly,     longTimeout, fields, createCultureByAdmin);
router.post("/admin/for-vendor", protect, adminOnly,     longTimeout, fields, createCultureForVendor);

router.patch("/:id/approve", protect, adminOnly, approveCulture);
router.patch("/:id/suspend", protect, adminOnly, suspendCulture);
router.patch("/:id/feature", protect, adminOnly, featureCulture);

// ── Single resource ───────────────────────────────────────────────────────────
router.get("/:id",    getCultureById);
router.post("/",      protect, vendorOrAdmin, longTimeout, fields, createCulture);
router.put("/:id",    protect, vendorOrAdmin, longTimeout, fields, updateCulture);
router.delete("/:id", protect, deleteCulture);

export default router;