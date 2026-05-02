import express from "express";
import User from "../models/User.js";
import ArtisanProfile from "../models/ArtisanProfile.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", protect, requireAdmin, async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (status) filter.status = status;
    if (search) filter.name   = { $regex: search, $options: "i" };

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "pending", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await ArtisanProfile.findOneAndDelete({ user: req.params.id });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/role", protect, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be: user, vendor, or admin" });
    }

    if (req.user._id.toString() === req.params.id && role !== "admin") {
      return res.status(403).json({ message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

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

    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;