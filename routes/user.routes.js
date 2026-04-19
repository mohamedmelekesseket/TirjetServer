import express from "express";
import User from "../models/User.js";
<<<<<<< HEAD
import ArtisanProfile from "../models/ArtisanProfile.js"; // ← add
=======
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

<<<<<<< HEAD
// GET /api/users
=======
// GET /api/users  — list all users (Admin)
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
router.get("/", protect, requireAdmin, async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

<<<<<<< HEAD
// GET /api/users/:id
=======
// GET /api/users/:id  — get a single user (Admin)
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
router.get("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

<<<<<<< HEAD
// PATCH /api/users/:id/status
=======
// PATCH /api/users/:id/status  — block / activate (Admin)
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
router.patch("/:id/status", protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "pending", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
<<<<<<< HEAD
      { returnDocument: "after" }  // ← fixed
=======
      { new: true }
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

<<<<<<< HEAD
// DELETE /api/users/:id
=======
// DELETE /api/users/:id  — delete a user (Admin)
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
router.delete("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
<<<<<<< HEAD
    await ArtisanProfile.findOneAndDelete({ user: req.params.id }); // ← cleanup
=======
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

<<<<<<< HEAD
// PATCH /api/users/:id/role  ← now handles ArtisanProfile
=======


// ── Add this route to your existing users.routes.js ──────────────────
// PATCH /api/users/:id/role  — change user role (Admin)

>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
router.patch("/:id/role", protect, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be: user, vendor, or admin" });
    }

<<<<<<< HEAD
=======
    // Prevent admin from demoting themselves
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    if (req.user._id.toString() === req.params.id && role !== "admin") {
      return res.status(403).json({ message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
<<<<<<< HEAD
      { returnDocument: "after" }  // ← fixed
=======
      { new: true }
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

<<<<<<< HEAD
    // ── ArtisanProfile sync ──────────────────────────────────────────
    if (role === "vendor") {
      const exists = await ArtisanProfile.findOne({ user: user._id });
      if (!exists) {
        await ArtisanProfile.create({ user: user._id });
        console.log("✅ ArtisanProfile created for", user._id);
      }
    } else {
      await ArtisanProfile.findOneAndDelete({ user: user._id });
      console.log("🗑️ ArtisanProfile removed for", user._id);
    }

=======
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
<<<<<<< HEAD

=======
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
export default router;