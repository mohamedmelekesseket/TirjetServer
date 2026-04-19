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

// Read
router.get("/",        protect, adminOnly, getAllOrders);   // admin sees everything
router.get("/mine",    protect, getMyOrders);
router.get("/artisan", protect, getArtisanOrders);
router.get("/:id",     protect, getOrderById);

// Create
router.post("/",         protect, createOrder);
router.post("/checkout", protect, checkoutFromCart);

// Mutate — full status control (admin/vendor)
router.patch("/:id/status", protect, updateOrderStatus);

// Cancel — owner OR admin
router.patch("/:id/cancel", protect, cancelOrder);

export default router;