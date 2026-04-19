import express from "express";
import {
  addComment,
  getProductComments,
  deleteComment,
  updateComment,          // 👈 add
} from "../controllers/commentController.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", getProductComments);
router.post("/", protect, addComment);
router.patch("/:commentId", protect, updateComment);   // 👈 add
router.delete("/:commentId", protect, deleteComment);  // already exists

export default router;