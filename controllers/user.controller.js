import User from "../models/User.js";
import ArtisanProfile from "../models/ArtisanProfile.js";

// ─────────────────────────────────────────
// @desc    Get all users
// @route   GET /api/users
// @access  Admin
// ─────────────────────────────────────────
export const getAllUsers = async (req, res) => {
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
};

// ─────────────────────────────────────────
// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Admin
// ─────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update user role (promote to vendor / admin)
// @route   PATCH /api/users/:id/role
// @access  Admin
// ─────────────────────────────────────────
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // ── ArtisanProfile sync ───────────────────────────────────────────
    try {
      console.log("Role:", role, "| User ID:", user._id); // ← debug

      if (role === "vendor") {
        const exists = await ArtisanProfile.findOne({ user: user._id });
        console.log("Existing profile:", exists);         // ← debug
        if (!exists) {
          const created = await ArtisanProfile.create({ user: user._id });
          console.log("Created ArtisanProfile:", created); // ← debug
        }
      } else {
        const deleted = await ArtisanProfile.findOneAndDelete({ user: user._id });
        console.log("Deleted ArtisanProfile:", deleted);  // ← debug
      }
    } catch (profileErr) {
      // Log but don't fail the whole request
      console.error("ArtisanProfile sync error:", profileErr.message);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Block or activate a user
// @route   PATCH /api/users/:id/status
// @access  Admin
// ─────────────────────────────────────────
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "pending", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Prevent admin from blocking themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot change your own status" });
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
};

// ─────────────────────────────────────────
// @desc    Delete a user
// @route   DELETE /api/users/:ida
// @access  Admin
// ─────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update own profile (name, image)
// @route   PUT /api/users/profile
// @access  Private
// ─────────────────────────────────────────
export const updateMyProfile = async (req, res) => {
  try {
    const { name, image } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, image },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};