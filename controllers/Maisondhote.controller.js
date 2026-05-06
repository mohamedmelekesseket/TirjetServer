import MaisonDhote from "../models/MaisonsDhotes.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// ── Upload helper (same as product controller) ────────────────────────────────
const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "artisana/maisons-dhotes",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// ── Build document helper ─────────────────────────────────────────────────────
function buildMaisonDoc({ body, hostId, images }) {
  const {
    name, description, type,
    location, region, governorate, tag,
    pricePerNight, currency, minNights,
    phone, website,
    amenities,
  } = body;

  return {
    name,
    description,
    type,
    location,
    region,
    governorate,
    tag,
    phone,
    website,
    pricePerNight: Number(pricePerNight),
    currency:  currency  || "TND",
    minNights: minNights ? Number(minNights) : 1,
    amenities: amenities
      ? Array.isArray(amenities) ? amenities : JSON.parse(amenities)
      : [],
    images,
    host:       hostId,
    isApproved: false,
  };
}

// ─────────────────────────────────────────
// @desc    Get all maisons d'hôtes (public, with filters)
// @route   GET /api/maisons-dhotes
// @access  Public
// ─────────────────────────────────────────
export const getAllMaisons = async (req, res) => {
  try {
    const {
      type, governorate, region, tag, search,
      approved, featured, editorsPick,
      minPrice, maxPrice,
      page = 1, limit = 20,
    } = req.query;

    const filter = {};

    if (type)          filter.type        = type; // "traditionnelle" | "moderne"
    if (governorate)   filter.governorate = governorate;
    if (region)        filter.region      = region;
    if (tag)           filter.tag         = { $regex: tag, $options: "i" };
    if (search)        filter.name        = { $regex: search, $options: "i" };
    if (approved    !== undefined) filter.isApproved    = approved    === "true";
    if (featured    !== undefined) filter.isFeatured    = featured    === "true";
    if (editorsPick !== undefined) filter.isEditorsPick = editorsPick === "true";
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    const total   = await MaisonDhote.countDocuments(filter);
    const maisons = await MaisonDhote.find(filter)
      .populate("host", "name email image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ maisons, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get a single maison d'hôte by ID
// @route   GET /api/maisons-dhotes/:id
// @access  Public
// ─────────────────────────────────────────
export const getMaisonById = async (req, res) => {
  try {
    const maison = await MaisonDhote.findById(req.params.id)
      .populate("host", "name email image");

    if (!maison) return res.status(404).json({ message: "Maison d'hôte not found" });

    const alreadyTracked = req.query.viewed === "1";
    if (!alreadyTracked) {
      await MaisonDhote.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      maison.views = (maison.views ?? 0) + 1;
    }

    res.json(maison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get maisons belonging to the logged-in host
// @route   GET /api/maisons-dhotes/mine
// @access  Private (vendor)
// ─────────────────────────────────────────
export const getMyMaisons = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;

    const filter = { host: req.user._id };
    if (type)   filter.type = type;
    if (search) filter.name = { $regex: search, $options: "i" };

    const total   = await MaisonDhote.countDocuments(filter);
    const maisons = await MaisonDhote.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ maisons, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Create a new maison d'hôte
// @route   POST /api/maisons-dhotes
// @access  Private (vendor)
// ─────────────────────────────────────────
export const createMaison = async (req, res) => {
  try {
    const { name, pricePerNight, location, type } = req.body;

    if (!name || !pricePerNight || !location || !type) {
      return res.status(400).json({
        message: "name, pricePerNight, location and type are required",
      });
    }

    if (!["traditionnelle", "moderne"].includes(type)) {
      return res.status(400).json({
        message: "type must be 'traditionnelle' or 'moderne'",
      });
    }

    let images = [];
    if (req.files?.length) {
      images = await Promise.all(req.files.map((f) => uploadImage(f)));
    }

    const maison = await MaisonDhote.create(
      buildMaisonDoc({ body: req.body, hostId: req.user._id, images })
    );

    res.status(201).json(maison);
  } catch (error) {
    console.error("CREATE MAISON ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Admin creates a maison on behalf of a vendor
// @route   POST /api/maisons-dhotes/admin/for-vendor
// @access  Admin
// ─────────────────────────────────────────
export const createMaisonForVendor = async (req, res) => {
  try {
    const { name, pricePerNight, location, type, hostId } = req.body;

    if (!name || !pricePerNight || !location || !type || !hostId) {
      return res.status(400).json({
        message: "name, pricePerNight, location, type and hostId are required",
      });
    }

    const vendor = await User.findById(hostId);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(400).json({ message: "Target user is not a vendor" });
    }

    let images = [];
    if (req.files?.length) {
      images = await Promise.all(req.files.map((f) => uploadImage(f)));
    }

    const maison = await MaisonDhote.create(
      buildMaisonDoc({ body: req.body, hostId, images })
    );

    res.status(201).json(maison);
  } catch (error) {
    console.error("CREATE MAISON FOR VENDOR ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update a maison d'hôte
// @route   PUT /api/maisons-dhotes/:id
// @access  Private (host owner | admin)
// ─────────────────────────────────────────
export const updateMaison = async (req, res) => {
  try {
    const maison = await MaisonDhote.findById(req.params.id);
    if (!maison) return res.status(404).json({ message: "Maison d'hôte not found" });

    const isOwner = maison.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ── Image handling ────────────────────────────────────────────────────────
    let images = maison.images;

    if (req.files?.length) {
      const newImages = await Promise.all(req.files.map((f) => uploadImage(f)));
      images = req.body.appendImages === "true"
        ? [...maison.images, ...newImages]
        : newImages;
    } else if (req.body.images !== undefined) {
      const incoming = Array.isArray(req.body.images)
        ? req.body.images
        : JSON.parse(req.body.images);
      images = incoming.filter((url) => !url.startsWith("blob:"));
    }

    // ── Core fields ───────────────────────────────────────────────────────────
    const {
      name, description, type,
      location, region, governorate, tag,
      pricePerNight, currency, minNights, amenities,
      phone, website,
    } = req.body;

    const updateData = {};

    if (name          !== undefined) updateData.name          = name;
    if (description   !== undefined) updateData.description   = description;
    if (type          !== undefined) updateData.type          = type;
    if (location      !== undefined) updateData.location      = location;
    if (region        !== undefined) updateData.region        = region;
    if (governorate   !== undefined) updateData.governorate   = governorate;
    if (tag           !== undefined) updateData.tag           = tag;
    if (phone         !== undefined) updateData.phone         = phone;
    if (website       !== undefined) updateData.website       = website;
    if (pricePerNight !== undefined) updateData.pricePerNight = Number(pricePerNight);
    if (currency      !== undefined) updateData.currency      = currency;
    if (minNights     !== undefined) updateData.minNights     = Number(minNights);
    if (amenities     !== undefined) {
      updateData.amenities = Array.isArray(amenities)
        ? amenities
        : JSON.parse(amenities);
    }
    updateData.images = images;

    // ── Admin-only flags ──────────────────────────────────────────────────────
    const toBool = (v) => v === "true" || v === true;

    if (isAdmin) {
      const { isApproved, isSuspended, isFeatured, isEditorsPick } = req.body;
      if (isApproved    !== undefined) updateData.isApproved    = toBool(isApproved);
      if (isSuspended   !== undefined) updateData.isSuspended   = toBool(isSuspended);
      if (isFeatured    !== undefined) updateData.isFeatured    = toBool(isFeatured);
      if (isEditorsPick !== undefined) updateData.isEditorsPick = toBool(isEditorsPick);
    }

    const updated = await MaisonDhote.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    ).populate("host", "name email image");

    res.json(updated);
  } catch (error) {
    console.error("UPDATE MAISON ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Approve a maison d'hôte (admin)
// @route   PATCH /api/maisons-dhotes/:id/approve
// @access  Admin
// ─────────────────────────────────────────
export const approveMaison = async (req, res) => {
  try {
    const maison = await MaisonDhote.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!maison) return res.status(404).json({ message: "Maison d'hôte not found" });
    res.json({ message: "Maison d'hôte approved", maison });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Suspend / unsuspend a maison d'hôte (admin)
// @route   PATCH /api/maisons-dhotes/:id/suspend
// @access  Admin
// ─────────────────────────────────────────
export const suspendMaison = async (req, res) => {
  try {
    const maison = await MaisonDhote.findById(req.params.id);
    if (!maison) return res.status(404).json({ message: "Maison d'hôte not found" });

    const suspend =
      req.body.isSuspended !== undefined
        ? req.body.isSuspended === true || req.body.isSuspended === "true"
        : !maison.isSuspended;

    const updated = await MaisonDhote.findByIdAndUpdate(
      req.params.id,
      { isSuspended: suspend, isApproved: !suspend },
      { new: true }
    );

    res.json({
      message: suspend ? "Maison d'hôte suspended" : "Maison d'hôte reactivated",
      maison:  updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Delete a maison d'hôte
// @route   DELETE /api/maisons-dhotes/:id
// @access  Private (host owner | admin)
// ─────────────────────────────────────────
export const deleteMaison = async (req, res) => {
  try {
    const maison = await MaisonDhote.findById(req.params.id);
    if (!maison) return res.status(404).json({ message: "Maison d'hôte not found" });

    const isOwner = maison.host.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await maison.deleteOne();
    res.json({ message: "Maison d'hôte deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};