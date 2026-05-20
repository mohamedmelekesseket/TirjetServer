import express from "express";
import {
  createReservation,
  getMyReservations,
  getHostReservations,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,              // ← add
} from "../controllers/Reservation.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(  "/",            protect,              createReservation);
router.get(   "/mine",        protect,              getMyReservations);
router.get(   "/host",        protect,              getHostReservations);
router.get(   "/",            protect, requireAdmin, getAllReservations);
router.patch( "/:id/status",  protect,              updateReservationStatus);
router.delete("/:id",         protect, requireAdmin, deleteReservation);   // ← add

export default router;