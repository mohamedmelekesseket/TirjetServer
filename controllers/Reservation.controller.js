import Reservation from "../models/Reservation.js";
import MaisonDhote from "../models/MaisonsDhotes.js";

// POST /api/reservations  — create
export const createReservation = async (req, res) => {
  try {
    const { maisonId, checkIn, checkOut, guests, message, phone } = req.body;

    if (!maisonId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ message: "maisonId, checkIn, checkOut and guests are required" });
    }

    const maison = await MaisonDhote.findById(maisonId);
    if (!maison) return res.status(404).json({ message: "Maison not found" });
    if (!maison.isApproved || maison.isSuspended) {
      return res.status(400).json({ message: "Maison is not available" });
    }

    const inDate  = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (outDate <= inDate) {
      return res.status(400).json({ message: "Check-out must be after check-in" });
    }

    const nights = Math.ceil((outDate - inDate) / 86_400_000);
    if (maison.minNights && nights < maison.minNights) {
      return res.status(400).json({
        message: `Minimum stay is ${maison.minNights} night(s)`,
      });
    }

    // Check for overlapping reservations
    const conflict = await Reservation.findOne({
      maison: maisonId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        { checkIn: { $lt: outDate }, checkOut: { $gt: inDate } },
      ],
    });
    if (conflict) {
      return res.status(400).json({ message: "These dates are already booked" });
    }

    const totalPrice = nights * maison.pricePerNight;

    const reservation = await Reservation.create({
      maison:  maisonId,
      user:    req.user._id,
      host:    maison.host,
      checkIn: inDate,
      checkOut: outDate,
      nights,
      guests:  Number(guests),
      totalPrice,
      currency: maison.currency ?? "TND",
      message:  message ?? "",
      phone:    phone ?? "",
    });

    await reservation.populate([
      { path: "maison", select: "name location images pricePerNight" },
      { path: "user",   select: "name email" },
    ]);

    res.status(201).json(reservation);
  } catch (err) {
    console.error("CREATE RESERVATION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reservations/mine  — logged-in user's reservations
export const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate("maison", "name location images pricePerNight currency")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reservations/host  — host's incoming reservations
export const getHostReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ host: req.user._id })
      .populate("maison", "name location images")
      .populate("user",   "name email")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reservations  — admin: all reservations
export const getAllReservations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const total  = await Reservation.countDocuments(filter);
    const reservations = await Reservation.find(filter)
      .populate("maison", "name location")
      .populate("user",   "name email")
      .populate("host",   "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ reservations, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/reservations/:id/status  — host or admin updates status
export const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const isHost  = reservation.host.toString()  === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isOwner = reservation.user.toString()  === req.user._id.toString();

    // Only host/admin can confirm; user can cancel their own
    if (!isHost && !isAdmin && !(isOwner && status === "cancelled")) {
      return res.status(403).json({ message: "Not authorized" });
    }

    reservation.status = status;
    await reservation.save();

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// DELETE /api/reservations/:id  — admin deletes a reservation
export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    await reservation.deleteOne();
    res.json({ message: "Reservation deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};