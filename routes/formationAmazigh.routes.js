import express from "express";
import {
  submitForm,
  getAllForms,
  getFormById,
  updateFormStatus,
  deleteForm,
} from "../controllers/formationAmazigh.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

console.log("[Routes] Formation Amazigh routes loaded");

// Public — anyone can submit
router.post("/", (req, res, next) => {
  console.log("[Route] POST /api/formation-amazigh called");
  console.log("[Route] Request body:", req.body);
  next();
}, submitForm);

// Admin only
router.get("/",              protect, requireAdmin, getAllForms);
router.get("/:id",           protect, requireAdmin, getFormById);
router.patch("/:id/status",  protect, requireAdmin, updateFormStatus);
router.delete("/:id",        protect, requireAdmin, deleteForm);

export default router;