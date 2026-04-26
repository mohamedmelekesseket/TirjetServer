import express from "express";
import {
  getAllOrders,
  getMyOrders,
  getArtisanOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  checkoutFromCart,
} from "../controllers/order.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

  router.get("/mine",    protect, getMyOrders);
router.get("/artisan", protect, getArtisanOrders);
router.get("/:id",     protect, getOrderById);
router.get("/",        protect, adminOnly, getAllOrders);

router.post("/checkout", protect, checkoutFromCart);
router.post("/",         protect, createOrder);

router.patch("/:id/status", protect, updateOrderStatus);
router.patch("/:id/cancel", protect, cancelOrder);

export default router;