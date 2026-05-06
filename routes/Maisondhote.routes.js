import express from "express";
import {
  getAllMaisons,
  getMaisonById,
  getMyMaisons,
  createMaison,
  createMaisonForVendor,
  updateMaison,
  approveMaison,
  suspendMaison,
  deleteMaison,
} from "../controllers/Maisondhote.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireVendor } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// GET  /api/maisons-dhotes
//      ?type=traditionnelle|moderne
//      &governorate=Jendouba&region=Ain+Draham&tag=FOREST
//      &minPrice=100&maxPrice=500&search=dar
//      &approved=true&featured=true&editorsPick=true
//      &page=1&limit=20
router.get("/", getAllMaisons);

// GET  /api/maisons-dhotes/mine  — host's own listings
router.get("/mine", protect, requireVendor, getMyMaisons);

// POST /api/maisons-dhotes/admin/for-vendor  — admin creates on behalf of vendor
router.post(
  "/admin/for-vendor",
  protect,
  requireAdmin,
  upload.array("images", 8),
  createMaisonForVendor
);

// GET  /api/maisons-dhotes/:id
router.get("/:id", getMaisonById);

// POST /api/maisons-dhotes
router.post("/", protect, requireVendor, upload.array("images", 8), createMaison);

// PUT  /api/maisons-dhotes/:id
router.put("/:id", protect, upload.array("images", 8), updateMaison);

// PATCH /api/maisons-dhotes/:id/approve
router.patch("/:id/approve", protect, requireAdmin, approveMaison);

// PATCH /api/maisons-dhotes/:id/suspend
router.patch("/:id/suspend", protect, requireAdmin, suspendMaison);

// DELETE /api/maisons-dhotes/:id
router.delete("/:id", protect, deleteMaison);

export default router;