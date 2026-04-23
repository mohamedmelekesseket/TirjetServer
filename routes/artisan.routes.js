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
  getAllApprovedArtisans,
  adminUpdateArtisan,
} from "../controllers/artisan.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireVendor } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public — no auth required
router.get("/public", getAllApprovedArtisans);

// Admin — all artisans list
router.get("/", protect, requireAdmin, getAllArtisans);

// Vendor — own profile
router.get("/me", protect, requireVendor, getMyProfile);
// ✅ Already correct in your router — just double-check this is what's running:
router.put("/me", protect, requireVendor, upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "images", maxCount: 8 },
]), upsertMyProfile);

// Any logged-in user — apply as artisan (MUST be before /:id)
router.post("/apply", protect, upload.array("images", 8), applyAsArtisan);

// Admin — approve / reject / update / delete
router.patch("/:id/approve", protect, requireAdmin, approveArtisan);
router.patch("/:id/reject",  protect, requireAdmin, rejectArtisan);
router.patch("/:id",         protect, requireAdmin, upload.array("images", 8), adminUpdateArtisan);
router.delete("/:id",        protect, requireAdmin, deleteArtisan);

// Public profile — MUST be last
router.get("/:userId", getArtisanByUserId);

export default router;