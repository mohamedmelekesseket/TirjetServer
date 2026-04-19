import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/Cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; // adjust import to your middleware

const router = express.Router();

router.use(protect); // all cart routes require auth

router.get("/", getCart);
router.post("/", addToCart);
router.patch("/:productId", updateCartItem);
router.delete("/", clearCart);
router.delete("/:productId", removeFromCart);

export default router;