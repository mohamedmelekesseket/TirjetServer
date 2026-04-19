import express from "express";
import {
  getAllArtisans,
  getArtisanByUserId,
  getMyProfile,
  upsertMyProfile,
  approveArtisan,
  rejectArtisan,
  deleteArtisan,
  applyAsArtisan,
} from "../controllers/artisan.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireVendor } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// GET  /api/artisans              — all artisans (Admin)
router.get("/", protect, requireAdmin, getAllArtisans);

// GET  /api/artisans/me           — own profile (Vendor)
router.get("/me", protect, requireVendor, getMyProfile);

// PUT  /api/artisans/me           — create/update own profile (Vendor)
router.put("/me", protect, requireVendor, upload.array("images", 8), upsertMyProfile);

// POST /api/artisans/apply        — any logged-in user applies  ← MUST be before /:userId
router.post("/apply", protect, upload.array("images", 8), applyAsArtisan);

// PATCH /api/artisans/:id/approve — approve (Admin)
router.patch("/:id/approve", protect, requireAdmin, approveArtisan);

// PATCH /api/artisans/:id/reject  — reject/suspend (Admin)
router.patch("/:id/reject", protect, requireAdmin, rejectArtisan);

// DELETE /api/artisans/:id        — delete profile (Admin)
router.delete("/:id", protect, requireAdmin, deleteArtisan);

// GET  /api/artisans/:userId      — public profile  ← MUST be last
router.get("/:userId", getArtisanByUserId);

export default router;